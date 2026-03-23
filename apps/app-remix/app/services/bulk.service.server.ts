import type { AdminApiContext } from "@shopify/shopify-app-remix/server";
import { BULK_OPERATION_RUN_QUERY, CURRENT_BULK_OPERATION } from "../gql/bulk.server";
import { PRODUCTS_BULK_SELECTION } from "../gql/products.server";
import { logger } from "@repo/logger";

import prisma from "../db.server";

type BulkStatus =
    | "CREATED" | "RUNNING" | "CANCELED" | "CANCELING"
    | "COMPLETED" | "EXPIRED" | "FAILED";

type CurrentBulk = {
    id: string;
    status: BulkStatus;
    url?: string | null;
    errorCode?: string | null;
} | null | undefined;

export async function getCurrentBulk(admin: AdminApiContext["admin"]): Promise<CurrentBulk> {
    const r = await admin.graphql(CURRENT_BULK_OPERATION);
    const j = await r.json();
    return j?.data?.currentBulkOperation as CurrentBulk;
}

export async function startProductsBulk(admin: AdminApiContext["admin"], shop: string) {
    logger.info({ shop }, "Starting products bulk sync");

    try {
        logger.debug({ shop }, "Calling Shopify GraphQL");
        const r = await admin.graphql(BULK_OPERATION_RUN_QUERY, {
            variables: { query: PRODUCTS_BULK_SELECTION },
        });
        logger.debug({ shop }, "GraphQL response received");

        const j = await r.json();
        logger.debug({ shop, response: j }, "Bulk operation response");

        const err = j?.data?.bulkOperationRunQuery?.userErrors?.[0];

        if (err) {
            // If a bulk operation is already in progress, check if it's valid
            if (err.message?.toLowerCase().includes("progress")) {
                const current = await getCurrentBulk(admin);
                if (current && (current.status === "CREATED" || current.status === "RUNNING")) {
                    // Determine start time (fallback to now if not available)
                    const startedAt = new Date();

                    await prisma.shopStatus.upsert({
                        where: { shopId: shop },
                        create: {
                            shopId: shop,
                            productSyncState: "RUNNING",
                            productSyncStarted: startedAt,
                            productBulkOpId: current.id,
                        },
                        update: {
                            productSyncState: "RUNNING",
                            productSyncStarted: startedAt,
                            productBulkOpId: current.id,
                        },
                    });

                    logger.info({ shop, bulkOpId: current.id }, "Using existing bulk operation");
                    return current.id;
                }
            }
            throw new Error(`bulkOperationRunQuery: ${err.message}`);
        }

        // Update ShopStatus to RUNNING
        const bulkOpId = j?.data?.bulkOperationRunQuery?.bulkOperation?.id as string | undefined;
        logger.info({ shop }, "Updating ShopStatus to RUNNING");
        try {
            await prisma.shopStatus.upsert({
                where: { shopId: shop },
                create: {
                    shopId: shop,
                    productSyncState: "RUNNING",
                    productSyncStarted: new Date(),
                    productBulkOpId: bulkOpId ?? null,
                },
                update: {
                    productSyncState: "RUNNING",
                    productSyncStarted: new Date(),
                    productBulkOpId: bulkOpId ?? null,
                },
            });
            logger.info({ shop }, "ShopStatus updated to RUNNING");
        } catch (dbErr) {
            logger.error({ shop, error: dbErr }, "Failed to update ShopStatus");
        }

        logger.info({ shop, bulkOpId }, "Bulk operation started");
        return bulkOpId;
    } catch (error) {
        logger.error({ shop, error }, "Start products bulk failed");
        throw error;
    }
}

export async function runProductsExportAndGetUrl(
    admin: AdminApiContext["admin"],
    shop: string,
    { pollIntervalMs = 10_000, timeoutMs = 15 * 60 * 1000 } = {}
): Promise<string> {
    // If nothing is running, start one
    const current = await getCurrentBulk(admin);
    if (!current || (current.status !== "CREATED" && current.status !== "RUNNING")) {
        await startProductsBulk(admin, shop);
    }

    const started = Date.now();
    while (true) {
        const state = await getCurrentBulk(admin);
        const status = state?.status;

        if (status === "COMPLETED" && state?.url) return state.url!;
        if (status === "FAILED" || status === "CANCELED" || status === "EXPIRED") {
            throw new Error(`Bulk op ${status}${state?.errorCode ? ` (${state.errorCode})` : ""}`);
        }
        if (Date.now() - started > timeoutMs) {
            throw new Error("Timed out waiting for bulk export URL");
        }
        await new Promise(r => setTimeout(r, pollIntervalMs));
    }
}
