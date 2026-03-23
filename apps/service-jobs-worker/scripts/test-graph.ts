import { prisma } from '../src/db/prisma';
import { handleGraphWeightsJob } from '../src/handlers/graph.weights';

async function main() {
  const shopDomain = process.argv[2] || 'dev-recommender.myshopify.com';
  console.log(`🚀 [Test Graph] Starting graph weights generation for ${shopDomain}`);

  const shop = await prisma.shop.findUnique({
    where: { domain: shopDomain },
    select: { id: true },
  });

  if (!shop) {
    console.error(`❌ Shop ${shopDomain} not found`);
    process.exit(1);
  }

  await handleGraphWeightsJob(shop.id);
  console.log(`✅ [Test Graph] ProductGraph and CategoryGraph updated for ${shopDomain}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
