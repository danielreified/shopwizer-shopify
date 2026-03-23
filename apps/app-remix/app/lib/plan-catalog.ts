// app/lib/plan-catalog.ts

// ---------------------------------------------------------
// PUBLIC PLAN DEFINITION (UI + SELECTABLE PLANS)
// ---------------------------------------------------------

export type PlanBracket = {
  min: number;
  max: number;
  price: number;
  name: string;
  slug: string;
  label: string;
  isFree?: boolean;
};

export const PLAN_BRACKETS: PlanBracket[] = [
  {
    min: 0,
    max: 50,
    price: 0,
    name: "Free",
    slug: "free",
    label: "0–50 orders / month",
    isFree: true,
  },
  {
    min: 51,
    max: 100,
    price: 9,
    name: "Starter",
    slug: "starter",
    label: "51–100 orders / month",
  },
  {
    min: 101,
    max: 300,
    price: 19,
    name: "Pro",
    slug: "pro",
    label: "101–300 orders / month",
  },
  {
    min: 301,
    max: 500,
    price: 49,
    name: "Growth",
    slug: "growth",
    label: "301–500 orders / month",
  },
  {
    min: 501,
    max: 1000,
    price: 99,
    name: "Scale",
    slug: "scale",
    label: "501–1000 orders / month",
  },
  {
    min: 1001,
    max: 2000,
    price: 199,
    name: "Premium",
    slug: "premium",
    label: "1001–2000 orders / month",
  },
  {
    min: 2001,
    max: 3000,
    price: 249,
    name: "Pro Plus",
    slug: "pro_plus",
    label: "2001–3000 orders / month",
  },
  {
    min: 3001,
    max: 5000,
    price: 399,
    name: "Enterprise Lite",
    slug: "enterprise_lite",
    label: "3001–5000 orders / month",
  },
];

// ---------------------------------------------------------
// SHOPIFY BILLING KEYS
// ---------------------------------------------------------

export const SHOPIFY_PLAN_KEY: Record<string, string> = {
  free: "free_internal",
  starter: "starter_monthly",
  pro: "pro_monthly",
  growth: "growth_monthly",
  scale: "scale_monthly",
  premium: "premium_monthly",
  pro_plus: "pro_plus_monthly",
  enterprise_lite: "enterprise_lite_monthly",
};

// ---------------------------------------------------------
// PRICING MODEL FOR BILLING
// ---------------------------------------------------------

export const PLAN_PRICING = {
  starter_monthly: { amount: 9, interval: "EVERY_30_DAYS" },
  pro_monthly: { amount: 19, interval: "EVERY_30_DAYS" },
  growth_monthly: { amount: 49, interval: "EVERY_30_DAYS" },
  scale_monthly: { amount: 99, interval: "EVERY_30_DAYS" },
  premium_monthly: { amount: 199, interval: "EVERY_30_DAYS" },
  pro_plus_monthly: { amount: 249, interval: "EVERY_30_DAYS" },
  enterprise_lite_monthly: { amount: 399, interval: "EVERY_30_DAYS" },
};

export function getShopifyPlanKey(slug: string) {
  return SHOPIFY_PLAN_KEY[slug];
}

export function getPlanPricing(key: string): typeof PLAN_PRICING[keyof typeof PLAN_PRICING] | undefined {
  return PLAN_PRICING[key as keyof typeof PLAN_PRICING];
}

// ---------------------------------------------------------
// UTILS
// ---------------------------------------------------------

export function findBracketByName(name: string) {
  return PLAN_BRACKETS.find((p) => p.name.toLowerCase() === name.toLowerCase());
}
