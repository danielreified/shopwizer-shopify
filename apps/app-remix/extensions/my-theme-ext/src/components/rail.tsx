// src/components/rail.tsx

/** @jsxImportSource preact */
import { h } from "preact";
import { Widget } from "./widget";
import { fetchProductByHandle } from "../core/fetch/product";
import { mountByRecommender } from "../core/utils/mount";
import { createDebugger } from "../core/utils/debug";

// Import cart events interceptor (IIFE, runs on import)
import "../events/cartEvents";

const debug = createDebugger("RAIL", true);

/* --------------------------------------------------------------
   FETCH INTEGRATIONS (separate endpoint, cached per shop)
-------------------------------------------------------------- */
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

/* --------------------------------------------------------------
   GENERIC FETCHER for ANY rail
-------------------------------------------------------------- */
export function createRailLoader(basePath: string, rail: string) {
  return async function load(settings: Record<string, any>) {
    debug.log(`[${settings.recommender}] load() settings:`, settings);

    const shop = settings?.shop;
    const productId = settings?.productId;
    const variantId = settings?.variantId;
    const chosenId = variantId ? variantId : productId;
    const limit = Number(settings.productsToShow || 8);

    if (!shop) {
      debug.warn(`[${settings.recommender}] No shop domain`);
      return { products: [], slate_id: null, integrations: {} };
    }

    if (!chosenId) {
      debug.warn(`[${settings.recommender}] No productId or variantId`);
      return { products: [], slate_id: null, integrations: {} };
    }

    const url = `${basePath}/${shop}/${rail}/${chosenId}`;
    debug.log(`[${settings.recommender}] Fetching ${url}`);

    try {
      // Fetch recommendations and integrations in parallel
      const [recsRes, integrations] = await Promise.all([
        fetch(url),
        fetchIntegrations(shop),
      ]);

      if (!recsRes.ok) throw new Error(`API status ${recsRes.status}`);

      const data = await recsRes.json();
      const results = data.results || [];

      // Build a map of handle -> reviews data from API response
      const reviewsMap = new Map<string, { avgRating: string; numReviews: string }>();
      for (const r of results) {
        if (r.reviews) {
          reviewsMap.set(r.handle, r.reviews);
        }
      }

      const handles = results.map((r: any) => r.handle);
      debug.log(`[${settings.recommender}] Handles:`, handles);

      const products = await Promise.all(
        handles.slice(0, limit).map(async (handle: string) => {
          try {
            const product = await fetchProductByHandle(handle);
            if (!product) return null;

            // Merge reviews data into product metafields
            const reviewsData = reviewsMap.get(handle);
            if (reviewsData) {
              product.metafields = product.metafields || {};
              product.metafields.reviews = {
                avg_rating: reviewsData.avgRating,
                num_reviews: reviewsData.numReviews,
              };
            }

            return product;
          } catch {
            return null;
          }
        }),
      );

      return {
        products: products.filter(Boolean),
        slate_id: data.slate_id || null,
        p: data.p || null,
        ps: data.ps || null,
        integrations,
      };
    } catch (err) {
      debug.warn(`[${settings.recommender}] ERROR:`, err);
      return { products: [], slate_id: null, integrations: {} };
    }
  };
}

/* --------------------------------------------------------------
   GENERIC WIDGET FACTORY FOR ANY RAIL
-------------------------------------------------------------- */
export function createRailComponent(recommender: string, loader: (settings: any) => Promise<any>) {
  function RailComponent({ el }: { el: HTMLElement }) {
    return <Widget el={el} loader={loader} />;
  }

  debug.log(`[${recommender}] register mount`);
  mountByRecommender(recommender, (args) => RailComponent(args));

  return RailComponent;
}