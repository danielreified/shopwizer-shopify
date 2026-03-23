import type { ActionFunctionArgs } from "react-router";
import { authenticate } from "../../shopify.server";
import prisma from "../../db.server";
import { logger } from "@repo/logger";

const CANCEL_SUB_MUTATION = `#graphql
mutation CancelSubscription($id: ID!, $prorate: Boolean) {
  appSubscriptionCancel(id: $id, prorate: $prorate) {
    appSubscription { id status }
    userErrors { field message }
  }
}
`;

export const action = async ({ request }: ActionFunctionArgs) => {
    const { admin, session } = await authenticate.admin(request);
    const shopId = session.shop;

    logger.info({ shop: shopId }, "Unsubscribe API called");

    // Find active subscription for this shop
    const subscription = await prisma.shopSubscription.findFirst({
        where: { shopId, status: "ACTIVE" },
    });

    if (!subscription) {
        logger.warn({ shop: shopId }, "No active subscription found to cancel");
        return new Response(
            JSON.stringify({ error: "No active subscription found" }),
            { status: 400, headers: { "Content-Type": "application/json" } }
        );
    }

    logger.debug({ shop: shopId, subscriptionId: subscription.shopifyGid }, "Found active subscription");

    // Only call Shopify cancel if it's a real Shopify subscription (starts with "gid://")
    const isRealShopifySubscription = subscription.shopifyGid?.startsWith("gid://");

    if (isRealShopifySubscription) {
        logger.info({ shop: shopId, subscriptionId: subscription.shopifyGid }, "Cancelling Shopify subscription");

        // Cancel via Shopify GraphQL
        let raw;
        try {
            raw = await admin.graphql(CANCEL_SUB_MUTATION, {
                variables: {
                    id: subscription.shopifyGid,
                    prorate: true,
                },
            });
        } catch (err) {
            logger.error({ shop: shopId, error: err }, "Shopify GraphQL cancel failed");
            return new Response(
                JSON.stringify({ error: "Shopify GraphQL failed", details: String(err) }),
                { status: 400, headers: { "Content-Type": "application/json" } }
            );
        }

        const data = await raw.json();
        logger.debug({ shop: shopId, response: data }, "Shopify cancel response");

        const userErrors = data?.data?.appSubscriptionCancel?.userErrors;
        if (userErrors?.length) {
            return new Response(
                JSON.stringify({ error: "Cancel failed", details: userErrors }),
                { status: 400, headers: { "Content-Type": "application/json" } }
            );
        }
    } else {
        logger.info({ shop: shopId }, "Not a real Shopify subscription, skipping API call");
    }

    // Update existing subscription to CANCELLED and create/update a FREE plan entry
    await prisma.$transaction(async (tx) => {
        // Mark old subscription as cancelled
        await tx.shopSubscription.update({
            where: { id: subscription.id },
            data: { status: "CANCELLED" },
        });

        // Delete any redemption records so they go back to public plans view
        await tx.shopAppPlanCodeRedemption.deleteMany({
            where: { shopId },
        });

        // Find the free AppPlan
        const freePlan = await tx.appPlan.findUnique({
            where: { slug: "free" },
        });

        // Create or update free plan subscription
        await tx.shopSubscription.upsert({
            where: { shopifyGid: `free-${shopId}` },
            create: {
                shopId,
                shopifyGid: `free-${shopId}`,
                name: "Free",
                status: "ACTIVE",
                interval: "EVERY_30_DAYS",
                price: 0,
                isCustom: false,
                appPlanId: freePlan?.id ?? null,
            },
            update: {
                status: "ACTIVE",
                appPlanId: freePlan?.id ?? null,
            },
        });
    });

    logger.info({ shop: shopId }, "Subscription cancelled, shop moved to Free plan");

    return new Response(JSON.stringify({ ok: true }), {
        headers: { "Content-Type": "application/json" },
    });
};
