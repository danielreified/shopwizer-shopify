import type { ActionFunctionArgs } from "react-router";
import { authenticate } from "../../shopify.server";
import prisma from "../../db.server";
import { getShopifyPlanKey, getPlanPricing } from "../../lib/plan-catalog";
import { logger } from "@repo/logger";

const CREATE_SUB_MUTATION = `#graphql
mutation CreateSub(
  $name: String!,
  $returnUrl: URL!,
  $test: Boolean!,
  $lineItems: [AppSubscriptionLineItemInput!]!,
  $replacementBehavior: AppSubscriptionReplacementBehavior!,
  $trialDays: Int
) {
  appSubscriptionCreate(
    name: $name,
    returnUrl: $returnUrl,
    test: $test,
    lineItems: $lineItems,
    replacementBehavior: $replacementBehavior,
    trialDays: $trialDays
  ) {
    confirmationUrl
    appSubscription { id }
    userErrors { field message }
  }
}
`;

export const action = async ({ request }: ActionFunctionArgs) => {
  const { admin, session } = await authenticate.admin(request);
  const shop = session.shop;

  logger.info({ shop }, "Subscribe API called");

  let body;
  try {
    body = await request.json();
    logger.debug({ shop, body }, "Request body");
  } catch (err) {
    logger.warn({ shop, error: err }, "Invalid JSON body in subscribe request");
    return new Response(JSON.stringify({ error: "Invalid JSON body" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const slug = String(body.planSlug || body.slug || "").toLowerCase();
  const customAmount = body.customAmount ? Number(body.customAmount) : null;
  const cycle = body.cycle || "monthly";

  logger.debug({ shop, slug, cycle, customAmount }, "Parsed inputs");

  // ------------------------------------------
  // PRICING — Try DB first, then file catalog
  // ------------------------------------------
  let pricing;
  let planName = slug;

  // 1. Check for custom amount override
  if (customAmount !== null) {
    logger.info({ shop, customAmount }, "Using CUSTOM pricing");
    pricing = {
      amount: customAmount,
      interval: "EVERY_30_DAYS",
    };
  } else {
    // 2. Try to find plan in DB by slug
    const dbPlan = await prisma.appPlan.findUnique({
      where: { slug },
    });

    if (dbPlan && dbPlan.isActive) {
      logger.info({ shop, plan: dbPlan.name }, "Found DB plan");
      const amount = dbPlan.price?.toNumber ? dbPlan.price.toNumber() : Number(dbPlan.price);
      pricing = {
        amount,
        interval: dbPlan.interval === "MONTHLY" ? "EVERY_30_DAYS" : "ANNUAL",
      };
      planName = dbPlan.name;
    } else {
      // 3. Fall back to file-based catalog
      const planKey = getShopifyPlanKey(slug);
      pricing = getPlanPricing(planKey);

      logger.debug({ shop, planKey, pricing }, "Using file catalog plan");

      if (!pricing) {
        logger.warn({ shop, slug }, "Invalid plan slug, no pricing found");
        return new Response(JSON.stringify({ error: "Invalid plan slug" }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
      }
    }
  }

  // ------------------------------------------
  // Return URL
  // ------------------------------------------
  const store = shop.replace(".myshopify.com", "");

  const returnUrl = `https://admin.shopify.com/store/${store}/apps/${process.env.SHOPIFY_API_KEY}?subscribed=1`;
  logger.debug({ shop, returnUrl }, "Confirmation return URL");

  // ------------------------------------------
  // GraphQL variables
  // ------------------------------------------
  const variables = {
    name: `${planName} (${cycle})`,
    returnUrl,
    test: process.env.SHOPIFY_BILLING_TEST === "true",
    replacementBehavior: "STANDARD",
    trialDays: 14,
    lineItems: [
      {
        plan: {
          appRecurringPricingDetails: {
            interval: pricing.interval,
            price: {
              amount: pricing.amount,
              currencyCode: "USD",
            },
          },
        },
      },
    ],
  };

  logger.debug({ shop, variables }, "GraphQL Variables");

  // ------------------------------------------
  // Send request to Shopify
  // ------------------------------------------
  let raw;
  try {
    raw = await admin.graphql(CREATE_SUB_MUTATION, { variables });
  } catch (err) {
    logger.error({ shop, error: err }, "Shopify GraphQL failed");
    return new Response(
      JSON.stringify({ error: "Shopify GraphQL failed", details: String(err) }),
      {
        status: 400,
        headers: { "Content-Type": "application/json" },
      },
    );
  }

  let data;
  try {
    data = await raw.json();
    logger.debug({ shop, response: data }, "Shopify response");
  } catch (err) {
    return new Response(
      JSON.stringify({
        error: "Invalid Shopify JSON response",
        details: String(err),
      }),
      {
        status: 400,
        headers: { "Content-Type": "application/json" },
      },
    );
  }

  const confirmationUrl = data?.data?.appSubscriptionCreate?.confirmationUrl;
  const userErrors = data?.data?.appSubscriptionCreate?.userErrors;

  if (!confirmationUrl || userErrors?.length) {
    return new Response(
      JSON.stringify({
        error: "Create failed",
        details: userErrors ?? data,
      }),
      {
        status: 400,
        headers: { "Content-Type": "application/json" },
      },
    );
  }

  return new Response(JSON.stringify({ url: confirmationUrl }), {
    headers: { "Content-Type": "application/json" },
  });
};
