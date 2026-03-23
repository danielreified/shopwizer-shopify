// app/services/orders90.server.ts
import prisma from "../db.server";
import { normalizeToUSD } from "../utils/currency.server";

function numericId(gid: string | null): bigint | null {
  if (!gid) return null;
  const m = gid.match(/\/(\d+)$/);
  return m ? BigInt(m[1]) : null;
}

export async function fetchLast90DaysOrders(admin: any) {
  const fromISO = new Date(Date.now() - 90 * 24 * 3600 * 1000).toISOString();

  let orders: any[] = [];
  let cursor: string | null = null;

  while (true) {
    const res = await admin.graphql(
      `#graphql
      query FetchOrders($cursor: String) {
        orders(
          first: 200
          after: $cursor
          query: "created_at:>=${fromISO}"
          sortKey: CREATED_AT
        ) {
          edges {
            cursor
            node {
              id
              processedAt
              currencyCode
              totalPriceSet { shopMoney { amount } }
              lineItems(first: 100) {
                edges {
                  node {
                    id
                    quantity
                    variant { id }
                    product { id }
                    discountedUnitPriceSet { shopMoney { amount } }
                    originalUnitPriceSet { shopMoney { amount } }
                  }
                }
              }
            }
          }
          pageInfo { hasNextPage }
        }
      }`,
      { variables: { cursor } },
    );

    const json = await res.json();
    const edges = json.data.orders.edges;

    orders.push(...edges.map((e: any) => e.node));

    if (!json.data.orders.pageInfo.hasNextPage) break;

    cursor = edges[edges.length - 1].cursor;
  }

  return orders;
}

export async function saveOrdersToDatabase(shop: string, orders: any[]) {
  // Batch fetch all product categoryIds to avoid N+1 queries
  const allProductIds = new Set<bigint>();
  for (const order of orders) {
    for (const edge of order.lineItems.edges) {
      const pid = numericId(edge.node.product?.id ?? null);
      if (pid) allProductIds.add(pid);
    }
  }

  const categoryMap = new Map<bigint, string | null>();
  if (allProductIds.size > 0) {
    const products = await prisma.product.findMany({
      where: { id: { in: [...allProductIds] } },
      select: { id: true, categoryId: true },
    });
    for (const p of products) {
      categoryMap.set(p.id, p.categoryId);
    }
  }

  for (const order of orders) {
    const orderId = numericId(order.id);
    if (orderId == null) continue;

    const currency = order.currencyCode;
    const totalPrice = Number(order.totalPriceSet.shopMoney.amount);

    // USD conversion for order
    const totalPriceUsd = await normalizeToUSD(totalPrice, currency);

    // Use composite key for Order upsert
    await prisma.order.upsert({
      where: {
        id_shopId: {
          id: orderId,
          shopId: shop
        }
      },
      create: {
        id: orderId,
        shopId: shop,
        shopifyGid: order.id,

        totalPrice,
        totalPriceUsd,
        currency,

        processedAt: order.processedAt ? new Date(order.processedAt) : null,
        // createdAt/updatedAt are auto-managed by Prisma
      },
      update: {
        shopifyGid: order.id,
        totalPrice,
        totalPriceUsd,
        currency,
        processedAt: order.processedAt ? new Date(order.processedAt) : null,
      },
    });

    // ---------------------------------------------
    // INSERT/UPDATE ORDER LINE ITEMS
    // ---------------------------------------------
    for (const edge of order.lineItems.edges) {
      const li = edge.node;

      const lineItemId = numericId(li.id);
      if (lineItemId == null) continue;

      const productId = numericId(li.product?.id ?? null);
      const variantId = numericId(li.variant?.id ?? null);

      // Look up product's categoryId from pre-fetched map
      const categoryId = productId ? (categoryMap.get(productId) ?? null) : null;

      const unitDiscounted = Number(
        li.discountedUnitPriceSet?.shopMoney?.amount ?? 0,
      );
      const unitOriginal = Number(
        li.originalUnitPriceSet?.shopMoney?.amount ?? 0,
      );

      const unit = unitDiscounted > 0 ? unitDiscounted : unitOriginal;
      const price = unit * li.quantity;

      // USD conversion for line item
      const priceUsd = await normalizeToUSD(price, currency);

      // Use shopifyGid (unique) for upsert
      await prisma.orderLineItem.upsert({
        where: { shopifyGid: li.id },
        create: {
          id: lineItemId,
          shopId: shop,
          shopifyGid: li.id,

          orderId: orderId,

          productId,
          variantId,
          categoryId,

          quantity: li.quantity,
          price,
          priceUsd,
        },
        update: {
          productId,
          variantId,
          categoryId,
          quantity: li.quantity,
          price,
          priceUsd,
        },
      });
    }
  }
}

