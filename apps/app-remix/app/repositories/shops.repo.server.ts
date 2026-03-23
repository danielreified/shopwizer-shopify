// app/repositories/shops.repo.server.ts
import type { PrismaClient } from "@prisma/client";

type TxClient = Pick<PrismaClient, "shop" | "$transaction">;

export type ShopWrite = {
    shopifyGid?: string | null;
    name?: string | null;
    email?: string | null;
    primaryDomainUrl?: string | null;
    currency?: string | null;
    countryCode?: string | null;
    planName?: string | null;
    partnerDev?: boolean | null;
    scopes?: string | null;
};

export const makeShopRepo = (db: TxClient) => ({
    upsertByDomain(domain: string, data: ShopWrite) {
        return db.shop.upsert({
            where: { domain },
            create: { id: domain, domain, isActive: true, installedAt: new Date(), ...data },
            update: { ...data, isActive: true, uninstalledAt: null },
        });
    },
    markUninstalled(domain: string) {
        return db.shop.update({
            where: { domain },
            data: { isActive: false, uninstalledAt: new Date() },
        });
    },
    findByDomain(domain: string) {
        return db.shop.findUnique({ where: { domain } });
    }
});
