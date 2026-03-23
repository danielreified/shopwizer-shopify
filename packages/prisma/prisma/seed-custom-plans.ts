/**
 * prisma/seed-custom-plans.ts
 *
 * Creates TWO custom plans + promo codes for testing.
 *
 * In production you will use only one (slug: "custom").
 */

import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding TWO custom plans for testing…');

  // ---------------------------------------------------------
  // 1️⃣ CUSTOM PLAN A — "custom-basic"
  // ---------------------------------------------------------
  const customA = await prisma.appPlan.upsert({
    where: { slug: 'custom-basic' },
    update: {},
    create: {
      slug: 'custom-basic',
      name: 'Custom Basic Test Plan',
      interval: 'MONTHLY',
      currency: 'USD',
      price: 0, // dummy, real billing via Shopify
      isCustom: true,
      isActive: true,
    },
  });

  const customA_code = await prisma.appPlanCode.upsert({
    where: { code: 'BASIC2025' },
    update: {},
    create: {
      code: 'BASIC2025',
      title: 'Custom Basic Test Code',
      appPlanId: customA.id,
      isActive: true,
      maxRedemptions: 50,
    },
  });

  console.log(`→ Seeded custom-basic + BASIC2025`);

  // ---------------------------------------------------------
  // 2️⃣ CUSTOM PLAN B — "custom-premium"
  // ---------------------------------------------------------
  const customB = await prisma.appPlan.upsert({
    where: { slug: 'custom-premium' },
    update: {},
    create: {
      slug: 'custom-premium',
      name: 'Custom Premium Test Plan',
      interval: 'MONTHLY',
      currency: 'USD',
      price: 0,
      isCustom: true,
      isActive: true,
    },
  });

  const customB_code = await prisma.appPlanCode.upsert({
    where: { code: 'PREMIUM2025' },
    update: {},
    create: {
      code: 'PREMIUM2025',
      title: 'Custom Premium Test Code',
      appPlanId: customB.id,
      isActive: true,
      maxRedemptions: 25,
    },
  });

  console.log(`→ Seeded custom-premium + PREMIUM2025`);

  console.log('🌱 Finished seeding test custom plans!');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
