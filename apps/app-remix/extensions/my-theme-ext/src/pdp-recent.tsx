// src/pdp-recent.tsx

/** @jsxImportSource preact */
import { h } from "preact";
import { Widget } from "./components/widget";
import { fetchProductByHandle } from "./core/fetch/product";
import { mountByRecommender } from "./core/utils/mount";
import { getRecentlyViewed, recordRecentlyViewed } from "./core/recent/index";
import { createDebugger } from "./core/utils/debug";

const debug = createDebugger("RECENT", true);

/* ---- Fetch integrations for a shop ---- */
async function fetchIntegrations(shop: string) {
  try {
    const res = await fetch(`/apps/sw/integrations/${shop}`);
    if (!res.ok) {
      debug.warn("Failed to fetch integrations", res.status);
      return {};
    }
    const data = await res.json();
    return data.integrations || {};
  } catch (err) {
    debug.warn("Error fetching integrations", err);
    return {};
  }
}

/* ---- Custom loader for recently viewed (from localStorage) ---- */
async function loadRecent(settings: Record<string, any>) {
  debug.log("Loading recently viewed", settings);

  const limit = Number(settings.productsToShow || 8);
  const currentProductId = settings?.productId;
  const currentHandle = settings?.productHandle;
  const shop = settings?.shop;

  // 1. RECORD current product view (dedupes automatically)
  if (currentProductId && currentHandle) {
    recordRecentlyViewed(currentProductId, currentHandle);
    debug.log("Recorded current product:", currentHandle);
  }

  // 2. GET recently viewed from localStorage
  const recentItems = getRecentlyViewed();

  if (!recentItems.length) {
    debug.log("No recently viewed items");
    return { products: [], slate_id: null, integrations: {} };
  }

  debug.log("Recent items from storage:", recentItems);

  // 3. FILTER out current product (don't show "you just viewed this")
  const filteredItems = recentItems
    .filter((item: any) => String(item.pid) !== String(currentProductId))
    .slice(0, limit);

  if (!filteredItems.length) {
    debug.log("No items after filtering current product");
    return { products: [], slate_id: null, integrations: {} };
  }

  // 4. FETCH full product data and integrations in parallel
  const [products, integrations] = await Promise.all([
    Promise.all(
      filteredItems.map(async (item: any) => {
        try {
          return await fetchProductByHandle(item.handle);
        } catch (err) {
          debug.warn("Failed to fetch product:", item.handle, err);
          return null;
        }
      }),
    ),
    shop ? fetchIntegrations(shop) : Promise.resolve({}),
  ]);

  const validProducts = products.filter(Boolean);

  debug.log("Loaded products:", validProducts.length);
  debug.log("Loaded integrations:", integrations);

  return {
    products: validProducts,
    slate_id: null,
    integrations,
  };
}

/* ---- Mount the widget ---- */
function RecentWidget({ el }: { el: HTMLElement }) {
  return <Widget el={el} loader={loadRecent} />;
}

mountByRecommender("recent", (args) => RecentWidget(args));

export { RecentWidget };
