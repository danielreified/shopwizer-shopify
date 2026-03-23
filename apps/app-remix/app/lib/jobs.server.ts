import prisma from "../db.server";
import { JobType } from "@prisma/client";

const DEFAULT_JOBS = [
  { type: JobType.TRENDING, scheduleInterval: 2 },
  { type: JobType.BEST_SELLER, scheduleInterval: 2 },
  { type: JobType.NEW_ARRIVALS, scheduleInterval: 2 },
];

export async function initializeShopJobs(shopDomain: string) {
  const shop = await prisma.shop.findUnique({
    where: { domain: shopDomain },
    select: { id: true },
  });

  if (!shop) {
    return console.warn("⚠️ No shop found for job init", shopDomain);
  }

  const now = new Date();
  await prisma.job.createMany({
    data: DEFAULT_JOBS.map((j) => ({
      shopId: shop.id,
      type: j.type,
      scheduleInterval: j.scheduleInterval,
      nextRun: now,
    })),
    skipDuplicates: true,
  });

  console.log(`✅ Initialized default jobs for ${shopDomain}`);
}
