/**
 * prisma/seed.ts
 *
 * Run with:  npx prisma db seed
 */

import { PrismaClient, BillingInterval } from '@prisma/client';
const prisma = new PrismaClient();

// --------------------------------------------
// CANONICAL PLAN DEFINITIONS (public plans)
// These MUST match your frontend plan catalog.
// --------------------------------------------
const APP_PLANS = [
  {
    slug: 'free',
    name: 'Free',
    price: 0,
    interval: BillingInterval.MONTHLY,
    currency: 'USD',
    isActive: true,
    isCustom: false,
    monthlyOrderLimit: 5, // Low for testing
  },
  {
    slug: 'starter',
    name: 'Starter',
    price: 9,
    interval: BillingInterval.MONTHLY,
    currency: 'USD',
    isActive: true,
    isCustom: false,
    monthlyOrderLimit: 10, // Low for testing
  },
  {
    slug: 'pro',
    name: 'Pro',
    price: 19,
    interval: BillingInterval.MONTHLY,
    currency: 'USD',
    isActive: true,
    isCustom: false,
    monthlyOrderLimit: 15, // Low for testing
  },
  {
    slug: 'growth',
    name: 'Growth',
    price: 49,
    interval: BillingInterval.MONTHLY,
    currency: 'USD',
    isActive: true,
    isCustom: false,
    monthlyOrderLimit: 20, // Low for testing
  },
  {
    slug: 'scale',
    name: 'Scale',
    price: 99,
    interval: BillingInterval.MONTHLY,
    currency: 'USD',
    isActive: true,
    isCustom: false,
    monthlyOrderLimit: 30, // Low for testing
  },
  {
    slug: 'premium',
    name: 'Premium',
    price: 199,
    interval: BillingInterval.MONTHLY,
    currency: 'USD',
    isActive: true,
    isCustom: false,
    monthlyOrderLimit: 40, // Low for testing
  },
  {
    slug: 'pro_plus',
    name: 'Pro Plus',
    price: 249,
    interval: BillingInterval.MONTHLY,
    currency: 'USD',
    isActive: true,
    isCustom: false,
    monthlyOrderLimit: 50, // Low for testing
  },
  {
    slug: 'enterprise_lite',
    name: 'Enterprise Lite',
    price: 399,
    interval: BillingInterval.MONTHLY,
    currency: 'USD',
    isActive: true,
    isCustom: false,
    monthlyOrderLimit: null, // Unlimited
  },
];

async function seedAppPlans() {
  console.log('→ Seeding AppPlan table…');

  for (const plan of APP_PLANS) {
    await prisma.appPlan.upsert({
      where: { slug: plan.slug },
      update: {
        name: plan.name,
        price: plan.price,
        interval: plan.interval,
        currency: plan.currency,
        isActive: plan.isActive,
        isCustom: plan.isCustom,
        monthlyOrderLimit: plan.monthlyOrderLimit,
      },
      create: {
        slug: plan.slug,
        name: plan.name,
        interval: plan.interval,
        currency: plan.currency,
        price: plan.price,
        isActive: plan.isActive,
        isCustom: plan.isCustom,
        monthlyOrderLimit: plan.monthlyOrderLimit,
      },
    });
  }

  console.log('   ✔ AppPlans seeded.');
}

async function main() {
  console.log('🌱  Seeding database …');

  await seedAppPlans();

  console.log('✅  Database seed complete!');
}

main().catch((err) => {
  console.error('❌  Seeding failed:', err);
  process.exit(1);
});
