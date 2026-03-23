import 'dotenv/config';
import { prisma } from '../src/db/prisma';

const shopId = process.argv[2];
if (!shopId) {
  console.error('Usage: tsx scripts/seed-product-features.ts <shopId>');
  process.exit(1);
}

const DRY_RUN = process.env.FEATURE_DRY_RUN === 'true';
const LIMIT = Number(process.env.FEATURE_LIMIT || 0);
const SEED = process.env.FEATURE_SEED ? Number(process.env.FEATURE_SEED) : null;

const CONFIG = {
  ZERO_RATE: Number(process.env.FEATURE_ZERO_RATE || 0.25),
  VIEWS30_MIN: Number(process.env.FEATURE_VIEWS30_MIN || 0),
  VIEWS30_MAX: Number(process.env.FEATURE_VIEWS30_MAX || 1200),
  V7_RATIO_MIN: Number(process.env.FEATURE_V7_RATIO_MIN || 0.2),
  V7_RATIO_MAX: Number(process.env.FEATURE_V7_RATIO_MAX || 0.5),
  V24_RATIO_MIN: Number(process.env.FEATURE_V24_RATIO_MIN || 0.08),
  V24_RATIO_MAX: Number(process.env.FEATURE_V24_RATIO_MAX || 0.25),
  CTR_MIN: Number(process.env.FEATURE_CTR_MIN || 0.01),
  CTR_MAX: Number(process.env.FEATURE_CTR_MAX || 0.12),
  CART_RATE_MIN: Number(process.env.FEATURE_CART_RATE_MIN || 0.15),
  CART_RATE_MAX: Number(process.env.FEATURE_CART_RATE_MAX || 0.5),
  ORDER_RATE_MIN: Number(process.env.FEATURE_ORDER_RATE_MIN || 0.05),
  ORDER_RATE_MAX: Number(process.env.FEATURE_ORDER_RATE_MAX || 0.3),
  AOV_MIN: Number(process.env.FEATURE_AOV_MIN || 20),
  AOV_MAX: Number(process.env.FEATURE_AOV_MAX || 200),
  BATCH_SIZE: Number(process.env.FEATURE_BATCH_SIZE || 100),
};

function makeRng(seed: number | null) {
  if (seed === null || Number.isNaN(seed)) {
    return () => Math.random();
  }
  let state = seed >>> 0;
  return () => {
    state ^= state << 13;
    state ^= state >>> 17;
    state ^= state << 5;
    return ((state >>> 0) % 1_000_000) / 1_000_000;
  };
}

const rng = makeRng(SEED);

function randBetween(min: number, max: number) {
  return min + (max - min) * rng();
}

function randInt(min: number, max: number) {
  return Math.floor(randBetween(min, max + 1));
}

function clampInt(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, Math.round(value)));
}

function money(value: number) {
  return Math.round(value * 100) / 100;
}

async function main() {
  const products = await prisma.product.findMany({
    where: { shopId, status: 'ACTIVE' },
    select: { id: true },
  });

  const target = LIMIT > 0 ? products.slice(0, LIMIT) : products;

  if (target.length === 0) {
    console.log('No products found for shop', shopId);
    return;
  }

  console.log(`Seeding ProductFeature for ${target.length} products (shop: ${shopId})`);
  if (DRY_RUN) console.log('DRY RUN: no DB writes will occur');

  let zeroed = 0;
  let updated = 0;

  for (let i = 0; i < target.length; i += CONFIG.BATCH_SIZE) {
    const batch = target.slice(i, i + CONFIG.BATCH_SIZE);

    const results = await Promise.allSettled(
      batch.map(async (p) => {
        const isZero = rng() < CONFIG.ZERO_RATE;
        if (isZero) zeroed += 1;

        const views30 = isZero ? 0 : randInt(CONFIG.VIEWS30_MIN, CONFIG.VIEWS30_MAX);

        const v7Ratio = randBetween(CONFIG.V7_RATIO_MIN, CONFIG.V7_RATIO_MAX);
        const v24Ratio = randBetween(CONFIG.V24_RATIO_MIN, CONFIG.V24_RATIO_MAX);

        const views7 = clampInt(views30 * v7Ratio, 0, views30);
        const views24 = clampInt(views7 * v24Ratio, 0, views7);

        const ctr = randBetween(CONFIG.CTR_MIN, CONFIG.CTR_MAX);
        const clicks7 = clampInt(views7 * ctr, 0, views7);
        const clicks30 = clampInt(views30 * ctr * randBetween(0.9, 1.1), 0, views30);
        const clicks24 = clampInt(views24 * ctr * randBetween(0.8, 1.2), 0, views24);

        const cartRate = randBetween(CONFIG.CART_RATE_MIN, CONFIG.CART_RATE_MAX);
        const carts7 = clampInt(clicks7 * cartRate, 0, clicks7);
        const carts30 = clampInt(clicks30 * cartRate, 0, clicks30);
        const carts24 = clampInt(clicks24 * cartRate, 0, clicks24);

        const orderRate = randBetween(CONFIG.ORDER_RATE_MIN, CONFIG.ORDER_RATE_MAX);
        const orders7 = clampInt(carts7 * orderRate, 0, carts7);
        const orders30 = clampInt(carts30 * orderRate, 0, carts30);

        const aov = randBetween(CONFIG.AOV_MIN, CONFIG.AOV_MAX);
        const revenue7 = money(orders7 * aov);
        const revenue30 = money(orders30 * aov);

        if (DRY_RUN) return;

        await prisma.productFeature.upsert({
          where: { productId: p.id },
          create: {
            shopId,
            productId: p.id,
            views24h: views24,
            views7d: views7,
            views30d: views30,
            clicks24h: clicks24,
            clicks7d: clicks7,
            clicks30d: clicks30,
            carts24h: carts24,
            carts7d: carts7,
            carts30d: carts30,
            orders7d: orders7,
            orders30d: orders30,
            revenue7d: revenue7,
            revenue30d: revenue30,
            bestSellerScore: null,
            trendingScore: null,
          },
          update: {
            views24h: views24,
            views7d: views7,
            views30d: views30,
            clicks24h: clicks24,
            clicks7d: clicks7,
            clicks30d: clicks30,
            carts24h: carts24,
            carts7d: carts7,
            carts30d: carts30,
            orders7d: orders7,
            orders30d: orders30,
            revenue7d: revenue7,
            revenue30d: revenue30,
            bestSellerScore: null,
            trendingScore: null,
          },
        });
        updated += 1;
      }),
    );

    const failures = results.filter((r) => r.status === 'rejected');
    if (failures.length > 0) {
      console.warn(`Batch had ${failures.length} failures`);
    }
  }

  console.log(`Done. Updated: ${updated}, Zeroed: ${zeroed}`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
