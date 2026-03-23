import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function check() {
    const shop = "shopwise-dev.myshopify.com";
    console.log(`Checking integrations for ${shop}...`);

    const integrations = await prisma.shopIntegration.findMany({
        where: {
            shop: { domain: shop },
            enabled: true,
        },
        select: { category: true, provider: true, meta: true },
    });

    console.log("Integrations:", JSON.stringify(integrations, null, 2));
    await prisma.$disconnect();
}

check();
