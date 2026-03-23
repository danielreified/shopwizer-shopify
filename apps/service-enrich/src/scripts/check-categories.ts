import { PrismaClient } from '@prisma/client';
import fs from 'fs';

const prisma = new PrismaClient();

async function main() {
  console.log('🚀 Starting Category Analysis...');
  const categories = await prisma.category.findMany({
    where: { parentId: null },
    select: { name: true, id: true },
  });

  const roots = categories.map((c) => ({ name: c.name, id: c.id }));
  console.log(`🔍 Found ${roots.length} root categories.`);

  const results: any[] = [];

  for (const root of roots) {
    console.log(`   Processing: ${root.name}...`);

    const getSamples = async (depth: number) => {
      const cats = await prisma.category.findMany({
        where: { pathIds: { has: root.id }, depth },
        select: { fullName: true },
        take: 10,
      });
      return cats.map((c) => c.fullName);
    };

    results.push({
      root: root.name,
      samples: {
        depth1: await getSamples(1),
        depth2: await getSamples(2),
        depth3: await getSamples(3),
        depth4: await getSamples(4),
      },
    });
  }

  const outputPath = './category_samples.json';
  fs.writeFileSync(
    outputPath,
    JSON.stringify(
      results,
      (key, value) => (typeof value === 'bigint' ? value.toString() : value),
      2,
    ),
  );
  console.log(`\n✅ Results saved to ${outputPath}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
