// app/services/analytics.server.ts
import prisma from "../db.server";

/* ============================================================================
 * DATE FORMATTING HELPERS
 * ========================================================================== */

/**
 * Get ISO date string for grouping (YYYY-MM-DD)
 */
function toISODateKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}

/* ============================================================================
 * LAST 7 DAYS (Charts) — Each metric = 1 function (no buckets)
 * ========================================================================== */

function get7DayWindow() {
  const end = new Date();
  end.setHours(23, 59, 59, 999);

  const start = new Date();
  start.setDate(start.getDate() - 6);
  start.setHours(0, 0, 0, 0);

  return { start, end };
}

/**
 * Build a date map with all 7 days initialized to 0
 * Returns both the map (for aggregation) and formatted keys
 * Uses UTC dates to match how order processedAt timestamps are stored
 */
function build7DayMap() {
  const map: Record<string, number> = {};
  const dateLabels: Record<string, string> = {};

  // Build 7 days using UTC to match database timestamps
  const todayUTC = new Date();
  const startDateUTC = new Date(Date.UTC(
    todayUTC.getUTCFullYear(),
    todayUTC.getUTCMonth(),
    todayUTC.getUTCDate() - 6
  ));

  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  for (let i = 0; i < 7; i++) {
    const d = new Date(startDateUTC);
    d.setUTCDate(d.getUTCDate() + i);
    const isoKey = d.toISOString().slice(0, 10); // YYYY-MM-DD in UTC
    map[isoKey] = 0;
    dateLabels[isoKey] = `${days[d.getUTCDay()]} ${d.getUTCDate()}`;
  }

  return { map, dateLabels };
}

/* ----------------------------
 * Attributed Sales (7 days)
 * ---------------------------- */
export async function getLast7DaysAttributedSales(shopId: string) {
  const { start, end } = get7DayWindow();

  // Get line items with their order's processedAt
  const lineItems = await prisma.orderLineItem.findMany({
    where: {
      shopId,
      order: { processedAt: { gte: start, lte: end } },
    },
    include: { order: { select: { processedAt: true } } },
  });

  const { map, dateLabels } = build7DayMap();

  for (const li of lineItems) {
    if (!li.attributed || !li.order?.processedAt) continue;

    const key = toISODateKey(li.order.processedAt);
    if (key in map) {
      map[key] += Number(li.price * li.quantity);
    }
  }

  return {
    name: "Attributed Sales",
    data: Object.entries(map).map(([isoKey, value]) => ({
      key: dateLabels[isoKey],
      value,
    })),
  };
}

/* ----------------------------
 * Attributed Items Count (7 days)
 * ---------------------------- */
export async function getLast7DaysAttributedItems(shopId: string) {
  const { start, end } = get7DayWindow();

  const lineItems = await prisma.orderLineItem.findMany({
    where: {
      shopId,
      order: { processedAt: { gte: start, lte: end } },
    },
    include: { order: { select: { processedAt: true } } },
  });

  const { map, dateLabels } = build7DayMap();

  for (const li of lineItems) {
    if (!li.attributed || !li.order?.processedAt) continue;

    const key = toISODateKey(li.order.processedAt);
    if (key in map) {
      map[key] += li.quantity;
    }
  }

  return {
    name: "Attributed Items",
    data: Object.entries(map).map(([isoKey, value]) => ({
      key: dateLabels[isoKey],
      value,
    })),
  };
}

/* ============================================================================
 * LAST 30 DAYS — Each metric = 1 function
 * ========================================================================== */

function get30DayWindow() {
  const end = new Date();
  end.setHours(23, 59, 59, 999);

  const start = new Date();
  start.setDate(start.getDate() - 29);
  start.setHours(0, 0, 0, 0);

  return { start, end };
}

export async function getLast30DaysAttributedSales(shopId: string) {
  const { start, end } = get30DayWindow();

  const lineItems = await prisma.orderLineItem.findMany({
    where: {
      shopId,
      order: { processedAt: { gte: start, lte: end } },
    },
    include: { order: { select: { processedAt: true } } },
  });

  return lineItems
    .filter((li) => li.attributed)
    .reduce((a, li) => a + Number(li.price * li.quantity), 0);
}

export async function getLast30DaysOrderCount(shopId: string) {
  const { start, end } = get30DayWindow();

  return prisma.order.count({
    where: { shopId, processedAt: { gte: start, lte: end } },
  });
}

/* ----------------------------
 * Attributed Revenue Percentage (7 days)
 * What % of total sales came from recommendations
 * ---------------------------- */
export async function getLast7DaysAttributedRevenuePercentage(shopId: string) {
  const { start, end } = get7DayWindow();

  // Get all orders with their line items for the past 7 days
  const orders = await prisma.order.findMany({
    where: {
      shopId,
      processedAt: { gte: start, lte: end },
    },
    include: {
      lineItems: {
        select: {
          price: true,
          quantity: true,
          attributed: true,
        },
      },
    },
  });

  // Build date maps for total and attributed sales
  const { map: totalMap, dateLabels } = build7DayMap();
  const attributedMap: Record<string, number> = { ...totalMap };

  for (const order of orders) {
    if (!order.processedAt) continue;
    const key = toISODateKey(order.processedAt);

    if (key in totalMap) {
      // Add total order value
      totalMap[key] += Number(order.totalPrice ?? 0);

      // Add attributed line item values
      for (const li of order.lineItems) {
        if (li.attributed) {
          attributedMap[key] += Number(li.price * li.quantity);
        }
      }
    }
  }

  // Calculate percentage for each day
  const data = Object.entries(totalMap).map(([isoKey, totalValue]) => {
    const attributedValue = attributedMap[isoKey] ?? 0;
    const percentage = totalValue > 0 ? (attributedValue / totalValue) * 100 : 0;
    return {
      key: dateLabels[isoKey],
      value: Math.round(percentage * 10) / 10, // Round to 1 decimal
    };
  });

  // Calculate overall percentage
  const totalSales = Object.values(totalMap).reduce((a, b) => a + b, 0);
  const totalAttributed = Object.values(attributedMap).reduce((a, b) => a + b, 0);
  const overallPercentage = totalSales > 0 ? (totalAttributed / totalSales) * 100 : 0;

  return {
    name: "Attributed Revenue %",
    data,
    overallPercentage: Math.round(overallPercentage * 10) / 10,
  };
}

/* ----------------------------
 * Attributed Orders Count (7 days)
 * Orders with at least one attributed line item
 * ---------------------------- */
export async function getLast7DaysAttributedOrdersCount(shopId: string) {
  const { start, end } = get7DayWindow();

  // Get distinct order IDs that have attributed line items
  const attributedLineItems = await prisma.orderLineItem.findMany({
    where: {
      shopId,
      attributed: true,
      order: { processedAt: { gte: start, lte: end } },
    },
    select: { orderId: true, order: { select: { processedAt: true } } },
    distinct: ["orderId"],
  });

  const { map, dateLabels } = build7DayMap();

  for (const li of attributedLineItems) {
    if (!li.order?.processedAt) continue;
    const key = toISODateKey(li.order.processedAt);
    if (key in map) {
      map[key] += 1;
    }
  }

  return {
    name: "Attributed Orders",
    data: Object.entries(map).map(([isoKey, value]) => ({
      key: dateLabels[isoKey],
      value,
    })),
  };
}

/* ----------------------------
 * Attributed Orders Count (30 days)
 * Orders with at least one attributed line item
 * ---------------------------- */
export async function getLast30DaysAttributedOrderCount(shopId: string) {
  const { start, end } = get30DayWindow();

  // Count distinct orders that have attributed line items
  const result = await prisma.orderLineItem.findMany({
    where: {
      shopId,
      attributed: true,
      order: { processedAt: { gte: start, lte: end } },
    },
    select: { orderId: true },
    distinct: ["orderId"],
  });

  return result.length;
}

/* ----------------------------
 * Attributed Items Count (30 days)
 * Total quantity of attributed line items
 * ---------------------------- */
export async function getLast30DaysAttributedItemsCount(shopId: string) {
  const { start, end } = get30DayWindow();

  const lineItems = await prisma.orderLineItem.findMany({
    where: {
      shopId,
      attributed: true,
      order: { processedAt: { gte: start, lte: end } },
    },
    select: { quantity: true },
  });

  return lineItems.reduce((acc, li) => acc + li.quantity, 0);
}

/* ============================================================================
 * RAIL CLICKS BY TYPE (Last 7 days)
 * Returns clicks aggregated per rail type for multi-line chart
 * ========================================================================== */

const RAIL_LABELS: Record<string, string> = {
  SIMILAR: "Similar",
  FBT: "Frequently Bought",
  TRENDING: "Trending",
  BEST_SELLER: "Best Sellers",
  RECENTLY_VIEWED: "Recently Viewed",
  NEW_ARRIVALS: "New Arrivals",
};

/* ============================================================================
 * RAIL CLICKS SERIES (Last 7 days) - For multi-line chart
 * Returns daily breakdown per rail type for Polaris Viz LineChart
 * ========================================================================== */

export async function getLast7DaysRailClicksSeries(shopId: string) {
  const { start, end } = get7DayWindow();

  // Get all rail metrics for the past 7 days
  const metrics = await prisma.railMetric.findMany({
    where: {
      shopId,
      hour: { gte: start, lte: end },
    },
    select: {
      rail: true,
      hour: true,
      clicks: true,
    },
  });

  // Build a map of rail -> date -> clicks
  const railDateMap = new Map<string, Map<string, number>>();

  for (const m of metrics) {
    const dateKey = toISODateKey(m.hour);
    const rail = m.rail;

    if (!railDateMap.has(rail)) {
      railDateMap.set(rail, new Map());
    }
    const dateMap = railDateMap.get(rail)!;
    dateMap.set(dateKey, (dateMap.get(dateKey) || 0) + m.clicks);
  }

  // Build all 7 date keys (use UTC to match how we parse the metric hours)
  const dateKeys: string[] = [];
  const dateLabels: Record<string, string> = {};

  // Start from today-6 in UTC
  const todayUTC = new Date();
  const startDateUTC = new Date(Date.UTC(
    todayUTC.getUTCFullYear(),
    todayUTC.getUTCMonth(),
    todayUTC.getUTCDate() - 6
  ));

  for (let i = 0; i < 7; i++) {
    const d = new Date(startDateUTC);
    d.setUTCDate(d.getUTCDate() + i);
    const isoKey = d.toISOString().slice(0, 10); // YYYY-MM-DD in UTC
    dateKeys.push(isoKey);
    // Format label using UTC day
    const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    dateLabels[isoKey] = `${days[d.getUTCDay()]} ${d.getUTCDate()}`;
  }

  // Convert to LineChart series format
  let series = Array.from(railDateMap.entries()).map(([rail, dateMap]) => ({
    name: RAIL_LABELS[rail] ?? rail,
    data: dateKeys.map((dateKey) => ({
      key: dateLabels[dateKey],
      value: dateMap.get(dateKey) || 0,
    })),
  }));

  // If no specific rail data, provide a flat line for "All Clicks"
  if (series.length === 0) {
    series = [{
      name: "Clicks",
      data: dateKeys.map((dateKey) => ({
        key: dateLabels[dateKey],
        value: 0,
      })),
    }];
  }

  // Sort series by total clicks (descending)
  series.sort((a, b) => {
    const totalA = a.data.reduce((sum, d) => sum + d.value, 0);
    const totalB = b.data.reduce((sum, d) => sum + d.value, 0);
    return totalB - totalA;
  });

  // Calculate total clicks for header
  const totalClicks = series.reduce(
    (sum, s) => sum + s.data.reduce((acc, d) => acc + d.value, 0),
    0
  );

  return { series, totalClicks };
}

/* ============================================================================
 * RAIL IMPRESSIONS SERIES (Last 7 days) - For multi-line chart
 * Returns daily breakdown per rail type for Polaris Viz LineChart
 * ========================================================================== */

export async function getLast7DaysRailImpressionsSeries(shopId: string) {
  const { start, end } = get7DayWindow();

  // Get all rail metrics for the past 7 days
  const metrics = await prisma.railMetric.findMany({
    where: {
      shopId,
      hour: { gte: start, lte: end },
    },
    select: {
      rail: true,
      hour: true,
      impressions: true,
    },
  });

  // Build a map of rail -> date -> impressions
  const railDateMap = new Map<string, Map<string, number>>();

  for (const m of metrics) {
    const dateKey = toISODateKey(m.hour);
    const rail = m.rail;

    if (!railDateMap.has(rail)) {
      railDateMap.set(rail, new Map());
    }
    const dateMap = railDateMap.get(rail)!;
    dateMap.set(dateKey, (dateMap.get(dateKey) || 0) + m.impressions);
  }

  // Build all 7 date keys (use UTC to match how we parse the metric hours)
  const dateKeys: string[] = [];
  const dateLabels: Record<string, string> = {};

  // Start from today-6 in UTC
  const todayUTC = new Date();
  const startDateUTC = new Date(Date.UTC(
    todayUTC.getUTCFullYear(),
    todayUTC.getUTCMonth(),
    todayUTC.getUTCDate() - 6
  ));

  for (let i = 0; i < 7; i++) {
    const d = new Date(startDateUTC);
    d.setUTCDate(d.getUTCDate() + i);
    const isoKey = d.toISOString().slice(0, 10); // YYYY-MM-DD in UTC
    dateKeys.push(isoKey);
    // Format label using UTC day
    const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    dateLabels[isoKey] = `${days[d.getUTCDay()]} ${d.getUTCDate()}`;
  }

  // Convert to LineChart series format
  let series = Array.from(railDateMap.entries()).map(([rail, dateMap]) => ({
    name: RAIL_LABELS[rail] ?? rail,
    data: dateKeys.map((dateKey) => ({
      key: dateLabels[dateKey],
      value: dateMap.get(dateKey) || 0,
    })),
  }));

  // If no specific rail data, provide a flat line for "All Impressions"
  if (series.length === 0) {
    series = [{
      name: "Impressions",
      data: dateKeys.map((dateKey) => ({
        key: dateLabels[dateKey],
        value: 0,
      })),
    }];
  }

  // Sort series by total impressions (descending)
  series.sort((a, b) => {
    const totalA = a.data.reduce((sum, d) => sum + d.value, 0);
    const totalB = b.data.reduce((sum, d) => sum + d.value, 0);
    return totalB - totalA;
  });

  // Calculate total impressions for header
  const totalImpressions = series.reduce(
    (sum, s) => sum + s.data.reduce((acc, d) => acc + d.value, 0),
    0
  );

  return { series, totalImpressions };
}

/* ============================================================================
 * TOP CONVERTING PRODUCTS (Last 30 days)
 * ========================================================================== */

export async function getTopConvertingProducts(shopId: string) {
  const { start, end } = get30DayWindow();

  // Get attributed line items from last 30 days
  const lineItems = await prisma.orderLineItem.findMany({
    where: {
      shopId,
      attributed: true,
      order: { processedAt: { gte: start, lte: end } },
    },
    select: {
      productId: true,
      quantity: true,
      price: true,
    },
  });

  // Aggregate by productId
  const productStats = new Map<string, { quantity: number; revenue: number }>();

  for (const li of lineItems) {
    if (!li.productId) continue;
    const key = li.productId.toString();
    const existing = productStats.get(key) ?? { quantity: 0, revenue: 0 };
    productStats.set(key, {
      quantity: existing.quantity + li.quantity,
      revenue: existing.revenue + Number(li.price * li.quantity),
    });
  }

  // Sort by revenue and take top 10
  const sorted = [...productStats.entries()]
    .sort((a, b) => b[1].revenue - a[1].revenue)
    .slice(0, 10);

  if (sorted.length === 0) return [];

  // Fetch product details
  const productIds = sorted.map(([id]) => BigInt(id));
  const products = await prisma.product.findMany({
    where: { id: { in: productIds } },
    select: { id: true, title: true, images: true },
  });

  const productMap = new Map(products.map((p) => [p.id.toString(), p]));

  return sorted.map(([productId, stats]) => {
    const product = productMap.get(productId);
    const productImages = product?.images as Array<{ url?: string }> | null;
    const imageUrl = productImages?.[0]?.url ?? null;

    return {
      id: productId,
      title: product?.title ?? `Product #${productId}`,
      subtitle: `${stats.quantity} sold via recommendations`,
      meta: `R${stats.revenue.toFixed(0)} attributed revenue`,
      avatarSrc: imageUrl ?? undefined,
    };
  });
}

/* ============================================================================
 * RECENT ATTRIBUTED ITEMS
 * ============================================================================ */

export async function getRecentAttributedItems(shopId: string) {
  const items = await prisma.orderLineItem.findMany({
    where: { shopId, attributed: true },
    orderBy: { createdAt: "desc" },
    take: 10,
    include: { order: true },
  });

  // Get unique productIds and fetch products separately
  const productIds = [...new Set(items.map((li) => li.productId).filter(Boolean))] as bigint[];

  const products = productIds.length > 0
    ? await prisma.product.findMany({
      where: { id: { in: productIds } },
      select: { id: true, title: true, images: true },
    })
    : [];

  // Create a map for quick lookup
  const productMap = new Map(products.map((p) => [p.id.toString(), p]));

  return items.map((li) => {
    const product = li.productId ? productMap.get(li.productId.toString()) : null;
    const productImages = product?.images as Array<{ url?: string }> | null;
    const imageUrl = productImages?.[0]?.url ?? null;

    return {
      id: String(li.id),
      title: product?.title ?? `Product #${li.productId}`,
      subtitle: `Qty: ${li.quantity}`,
      meta: `Order #${li.orderId}`,
      price: li.price * li.quantity,
      avatarSrc: imageUrl ?? undefined,
    };
  });
}

/* ============================================================================
 * FLEXIBLE ANALYTICS QUERIES (Custom date range + period)
 * ========================================================================== */

import {
  Period,
  generateIntervalsUTC,
  floorToPeriod,
  formatLabel,
} from "../utils/analytics";

type FlexibleQueryArgs = {
  shopId: string;
  since: Date;
  until: Date;
  period: Period;
};

type ChartPoint = { key: string; value: number };

/**
 * Build a map of all intervals in range initialized to 0
 */
function buildIntervalMap(since: Date, until: Date, period: Period) {
  const intervals = generateIntervalsUTC(since, until, period);
  const map = new Map<string, number>();

  for (const dt of intervals) {
    const key = floorToPeriod(dt, period).toISOString();
    map.set(key, 0);
  }

  return { intervals, map };
}

/**
 * Total Sales - flexible date range
 */
export async function getFlexibleTotalSales({ shopId, since, until, period }: FlexibleQueryArgs) {
  const orders = await prisma.order.findMany({
    where: {
      shopId,
      processedAt: { gte: since, lte: until },
    },
    select: { processedAt: true, totalPrice: true },
  });

  const { intervals, map } = buildIntervalMap(since, until, period);

  for (const o of orders) {
    if (!o.processedAt) continue;
    const key = floorToPeriod(o.processedAt, period).toISOString();
    if (map.has(key)) {
      map.set(key, (map.get(key) ?? 0) + Number(o.totalPrice ?? 0));
    }
  }

  const rows: [string, number][] = [];
  const points: ChartPoint[] = [];

  for (const dt of intervals) {
    const key = floorToPeriod(dt, period).toISOString();
    const value = map.get(key) ?? 0;
    rows.push([formatLabel(dt, period), value]);
    points.push({ key: dt.toISOString(), value });
  }

  return {
    rows,
    chart: { name: "Total Sales", data: points },
    total: rows.reduce((acc, [, v]) => acc + v, 0),
  };
}

/**
 * Attributed Sales - flexible date range
 */
export async function getFlexibleAttributedSales({ shopId, since, until, period }: FlexibleQueryArgs) {
  const lineItems = await prisma.orderLineItem.findMany({
    where: {
      shopId,
      attributed: true,
      order: { processedAt: { gte: since, lte: until } },
    },
    include: { order: { select: { processedAt: true } } },
  });

  const { intervals, map } = buildIntervalMap(since, until, period);

  for (const li of lineItems) {
    if (!li.order?.processedAt) continue;
    const key = floorToPeriod(li.order.processedAt, period).toISOString();
    if (map.has(key)) {
      map.set(key, (map.get(key) ?? 0) + Number(li.price * li.quantity));
    }
  }

  const rows: [string, number][] = [];
  const points: ChartPoint[] = [];

  for (const dt of intervals) {
    const key = floorToPeriod(dt, period).toISOString();
    const value = map.get(key) ?? 0;
    rows.push([formatLabel(dt, period), value]);
    points.push({ key: dt.toISOString(), value });
  }

  return {
    rows,
    chart: { name: "Attributed Sales", data: points },
    total: rows.reduce((acc, [, v]) => acc + v, 0),
  };
}

/**
 * Orders Count - flexible date range
 */
export async function getFlexibleOrdersCount({ shopId, since, until, period }: FlexibleQueryArgs) {
  const orders = await prisma.order.findMany({
    where: {
      shopId,
      processedAt: { gte: since, lte: until },
    },
    select: { processedAt: true },
  });

  const { intervals, map } = buildIntervalMap(since, until, period);

  for (const o of orders) {
    if (!o.processedAt) continue;
    const key = floorToPeriod(o.processedAt, period).toISOString();
    if (map.has(key)) {
      map.set(key, (map.get(key) ?? 0) + 1);
    }
  }

  const rows: [string, number][] = [];
  const points: ChartPoint[] = [];

  for (const dt of intervals) {
    const key = floorToPeriod(dt, period).toISOString();
    const value = map.get(key) ?? 0;
    rows.push([formatLabel(dt, period), value]);
    points.push({ key: dt.toISOString(), value });
  }

  return {
    rows,
    chart: { name: "Orders", data: points },
    total: rows.reduce((acc, [, v]) => acc + v, 0),
  };
}

/**
 * Attributed Orders Count - flexible date range
 * Distinct orders containing at least one attributed line item.
 */
export async function getFlexibleAttributedOrdersCount({
  shopId,
  since,
  until,
  period,
}: FlexibleQueryArgs) {
  const attributedOrders = await prisma.orderLineItem.findMany({
    where: {
      shopId,
      attributed: true,
      order: { processedAt: { gte: since, lte: until } },
    },
    select: { orderId: true, order: { select: { processedAt: true } } },
    distinct: ["orderId"],
  });

  const { intervals, map } = buildIntervalMap(since, until, period);

  for (const entry of attributedOrders) {
    if (!entry.order?.processedAt) continue;
    const key = floorToPeriod(entry.order.processedAt, period).toISOString();
    if (map.has(key)) {
      map.set(key, (map.get(key) ?? 0) + 1);
    }
  }

  const rows: [string, number][] = [];
  const points: ChartPoint[] = [];

  for (const dt of intervals) {
    const key = floorToPeriod(dt, period).toISOString();
    const value = map.get(key) ?? 0;
    rows.push([formatLabel(dt, period), value]);
    points.push({ key: dt.toISOString(), value });
  }

  return {
    rows,
    chart: { name: "Attributed Orders", data: points },
    total: rows.reduce((acc, [, v]) => acc + v, 0),
  };
}

/**
 * Attributed Items Count - flexible date range
 */
export async function getFlexibleAttributedItems({ shopId, since, until, period }: FlexibleQueryArgs) {
  const lineItems = await prisma.orderLineItem.findMany({
    where: {
      shopId,
      attributed: true,
      order: { processedAt: { gte: since, lte: until } },
    },
    include: { order: { select: { processedAt: true } } },
  });

  const { intervals, map } = buildIntervalMap(since, until, period);

  for (const li of lineItems) {
    if (!li.order?.processedAt) continue;
    const key = floorToPeriod(li.order.processedAt, period).toISOString();
    if (map.has(key)) {
      map.set(key, (map.get(key) ?? 0) + li.quantity);
    }
  }

  const rows: [string, number][] = [];
  const points: ChartPoint[] = [];

  for (const dt of intervals) {
    const key = floorToPeriod(dt, period).toISOString();
    const value = map.get(key) ?? 0;
    rows.push([formatLabel(dt, period), value]);
    points.push({ key: dt.toISOString(), value });
  }

  return {
    rows,
    chart: { name: "Attributed Items", data: points },
    total: rows.reduce((acc, [, v]) => acc + v, 0),
  };
}

