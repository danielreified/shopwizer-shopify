import prisma from "../db.server";
import {
    startProductsBulk,
    getCurrentBulk
} from "./bulk.service.server";
import {
    fetchLast90DaysOrders,
    saveOrdersToDatabase
} from "./orders90.server";
import { publish, Sources, DetailTypes } from "@repo/event-contracts";

export async function getOnboardingData(shopId: string) {
    const shopRecord = await prisma.shop.findUnique({
        where: { id: shopId },
        select: {
            recommenderPreferences: true,
            shopOnboarding: {
                select: { step: true },
            },
        },
    });

    const prefs = (shopRecord?.recommenderPreferences as any) ?? {
        gender: "auto",
        age: "auto",
    };

    const currentStep = shopRecord?.shopOnboarding?.step ?? "PREFERENCE";

    return {
        preferences: prefs,
        currentStep,
    };
}


export async function savePreferences(shopId: string, gender: string, age: string) {
    await prisma.$transaction([
        prisma.shop.update({
            where: { id: shopId },
            data: { recommenderPreferences: { gender, age } },
        }),
        prisma.shopOnboarding.updateMany({ where: { shopId }, data: { step: "SYNC_PRODUCTS" } })
    ]);
    return { ok: true };
}

export async function startProductSync(admin: any, shopId: string) {
    const existing = await getCurrentBulk(admin);
    if (existing?.status === "CREATED" || existing?.status === "RUNNING") {
        return { ok: true, opId: existing.id, alreadyRunning: true, status: existing.status, syncing: true };
    }
    const id = await startProductsBulk(admin, shopId);
    return { ok: true, opId: id ?? null, status: "CREATED", syncing: true };
}

export async function syncOrders90(admin: any, shopId: string) {
    const orders = await fetchLast90DaysOrders(admin);
    await saveOrdersToDatabase(shopId, orders);

    // Trigger initial job runs
    await Promise.all([
        publish({
            source: Sources.SERVICE_APP,
            detailType: DetailTypes.JOB_SCHEDULE,
            detail: { type: "TRENDING", shopId, force: true },
        }),
        publish({
            source: Sources.SERVICE_APP,
            detailType: DetailTypes.JOB_SCHEDULE,
            detail: { type: "BEST_SELLER", shopId, force: true },
        })
    ]);

    await prisma.shopOnboarding.updateMany({ where: { shopId }, data: { step: "THEME_INSTALL" } });
    return { ok: true, synced: orders.length };
}

export async function skipOrders(shopId: string) {
    await prisma.shopOnboarding.updateMany({ where: { shopId }, data: { step: "THEME_INSTALL" } });
    return { ok: true };
}

export async function completeOnboarding(shopId: string) {
    await prisma.shopOnboarding.updateMany({ where: { shopId }, data: { step: "COMPLETED" } });
    return { ok: true };
}
