/**
 * 🧭 SHOPWISE PIXEL TRACKING (Web Pixels Extension)
 * --------------------------------------------------------------
 * This script sends tracking events for:
 *  - Product interactions (viewed, added to cart)
 *  - Recommendation widget lifecycle (loaded, viewed, clicked)
 *
 * All events are sent as GET requests to:
 *    https://px.aluu.co.za/i.gif
 *
 * Each event includes a consistent schema for queryability in Athena.
 *
 * --------------------------------------------------------------
 * 🔑 EVENT OVERVIEW
 *
 * | Event Name     | Description                         | Fires When                               |
 * |----------------|--------------------------------------|------------------------------------------|
 * | view_prod      | Product viewed (Shopify native)      | Product detail page load                 |
 * | add_cart       | Product added to cart                | Add to cart event                        |
 * | reco_load      | Recommendation widget rendered       | Each widget load                         |
 * | reco_view      | Widget becomes visible in viewport   | Each widget enters viewport              |
 * | reco_click     | Recommended product clicked          | User clicks a recommendation card        |
 *
 * --------------------------------------------------------------
 * 🧩 COMMON FIELD SCHEMA
 *
 * | Field | Type | Description |
 * |--------|------|-------------|
 * | e      | string | Event type (e.g. "reco_click", "view_prod") |
 * | t      | number | UNIX timestamp (ms) |
 * | shop   | string | Shopify domain (e.g. "store.myshopify.com") |
 * | sid    | string | Session ID (UUID or Shopify session) |
 * | pid    | string | Product ID (Shopify GID stripped, optional) |
 * | vid    | string | Variant ID (Shopify GID stripped, optional) |
 * | plc    | string | Widget placement (e.g. "widget", "row") |
 * | rail   | string | Recommender type ("similar", "fbt", "trending", etc.) |
 * | src_pid| string | Source product ID (or "direct" if not from a recommendation) |
 * | slate_id | string | Unique recommendation batch ID |
 * | r      | string | Random short ID to ensure unique cache-busting |
 *
 * --------------------------------------------------------------
 * 🛰 TECHNICAL NOTES
 *
 * - Uses `navigator.sendBeacon()` when available for reliability (non-blocking).
 * - Falls back to `fetch()` GET if beacon is not supported.
 * - `DEBUG` flag logs all outgoing requests in console.
 * - Can be tested by calling:  `window.__swpx.send("test_event", { foo: 1 })`
 */
/**
 * 🧭 SHOPWISE PIXEL TRACKING (Web Pixels Extension)
 * --------------------------------------------------------------
 * Tracks product + recommendation events with attribution.
 * Safe for Shopify's isolated Pixel runtime (no DOM access).
 */

import { register } from "@shopify/web-pixels-extension";

register(({ analytics, settings, browser, init }) => {
  const DEBUG = false;
  const log = (...args) =>
    DEBUG &&
    console.log("%c[SW PX]", "color:#7c3aed;font-weight:bold;", ...args);

  const PX_ORIGIN = "https://px.shopwizer.co.za";
  const PX_PATH = "/i.gif";

  // 🥠 Cookie keys shared with storefront script (reco.js)
  const SID_COOKIE = "sw_sid"; // session id (UUID from reco.js)
  const SRC_COOKIE = "sw_src_pid"; // last source product id
  const SRC_TTL_MS = 10 * 60 * 1000; // 10 minutes

  // --- Cookie helpers (Web Pixels API) ---
  const getCookie = async (name) => {
    try {
      return await browser.cookie.get(name);
    } catch {
      return null;
    }
  };
  const setCookie = async (name, value, { maxAgeMs } = {}) => {
    try {
      const attrs = {};
      if (maxAgeMs) {
        // Convert to expires attribute (UTC string)
        attrs.expires = new Date(Date.now() + maxAgeMs).toUTCString();
      }
      await browser.cookie.set(name, value, attrs);
    } catch { }
  };

  // --- IDs & attribution (sandbox-friendly) ---
  const normalizeId = (id) => {
    if (!id) return null;
    const s = String(id);
    return s.includes("/") ? s.split("/").pop() : s;
  };

  let _sidCache = null;

  const getSessionId = () => {
    try {
      // ✅ Use Shopify’s session ID if available
      if (browser.session?.id) return browser.session.id;

      // ✅ Otherwise, generate one once per runtime
      if (!_sidCache) {
        _sidCache = crypto.randomUUID();
      }

      return _sidCache;
    } catch {
      // ✅ Final fallback
      return _sidCache || (_sidCache = crypto.randomUUID());
    }
  };

  const getLastSourceProductId = async () => {
    // We store plain pid in cookie; TTL is enforced by cookie expiry
    return await getCookie(SRC_COOKIE);
  };

  const saveSourceProductId = async (pid) => {
    if (!pid) return;
    await setCookie(SRC_COOKIE, String(pid), { maxAgeMs: SRC_TTL_MS });
  };

  // --- Transport ---
  const send = async (event, data = {}) => {
    const sid = await getSessionId();
    const shop = init.context?.document?.location?.hostname ?? "unknown.myshopify.com";

    const params = new URLSearchParams({
      e: event,
      t: Date.now().toString(),
      shop,
      sid,
      r: Math.random().toString(36).slice(2, 8),
    });

    for (const [k, v] of Object.entries(data)) {
      if (v == null) continue;
      params.append(k, typeof v === "object" ? JSON.stringify(v) : String(v));
    }

    const url = `${PX_ORIGIN}${PX_PATH}?${params.toString()}`;

    if (DEBUG) {
      try {
        const parsed = new URL(url);
        const query = Object.fromEntries(parsed.searchParams.entries());
        console.group(`[SW PX] → ${event}`);
        console.log("Full URL:", url);
        console.table(query);
        console.groupEnd();
      } catch (err) {
        console.warn("[SW PX] Failed to parse URL", err, url);
      }
    }

    try {
      if (navigator.sendBeacon) {
        const beaconData = new Blob([], { type: "image/gif" });
        if (navigator.sendBeacon(url, beaconData)) return;
      }
    } catch (err) {
      log("sendBeacon failed, using fetch()", err);
    }

    fetch(url, { method: "GET", mode: "no-cors" }).catch((err) =>
      log("fetch error", err),
    );
  };

  // --- Subscriptions ---
  analytics.subscribe("product_viewed", async (evt) => {
    const pid = normalizeId(
      evt.data?.productVariant?.product?.id ?? evt.data?.product?.id,
    );
    const vid = normalizeId(evt.data?.productVariant?.id);
    const src_pid = (await getLastSourceProductId()) || "direct";
    if (!pid) return;
    await send("view_prod", { pid, vid, src_pid });
  });

  analytics.subscribe("product_added_to_cart", async (evt) => {
    const line = evt.data?.cartLine ?? evt.data?.cartLines?.[0];
    const src_pid = (await getLastSourceProductId()) || "direct";
    await send("add_cart", {
      pid: normalizeId(line?.merchandise?.product?.id ?? line?.merchandise?.id),
      vid: normalizeId(line?.merchandise?.id),
      src_pid,
    });
  });


  analytics.subscribe("recommendation_clicked", async (evt) => {
    const d = evt.customData || {};
    const pid = normalizeId(d.productId ?? d.pid);
    const vid = normalizeId(d.variantId ?? d.vid);
    const plc = d.plc ?? d.placement ?? "unspecified";
    const rail = d.rail ?? "unknown";
    const slate_id = d.slate_id ?? null;
    const p = d.p ?? null; // compressed items payload
    const ps = d.ps ?? null; // compressed source payload

    // Persist source pid for cross-page attribution (10m TTL)
    if (pid) await saveSourceProductId(pid);

    // Use srcPid from event if provided, otherwise fallback to cookie
    const src_pid = normalizeId(d.srcPid) || (await getLastSourceProductId()) || "direct";
    await send("reco_click", { pid, vid, plc, rail, src_pid, slate_id, p, ps });
  });

  analytics.subscribe("recommendation_loaded", async (evt) => {
    const d = evt.customData || {};
    const plc = d.plc ?? d.placement ?? "unspecified";
    const rail = d.rail ?? "unknown";
    const src_pid = d.src_pid ?? (await getLastSourceProductId()) ?? "direct";
    const slate_id = d.slate_id ?? null;
    await send("reco_load", { plc, rail, src_pid, slate_id });
  });

  analytics.subscribe("recommendation_viewed", async (evt) => {
    const d = evt.customData || {};
    const plc = d.plc ?? d.placement ?? "unspecified";
    const rail = d.rail ?? "unknown";
    const src_pid = d.src_pid ?? (await getLastSourceProductId()) ?? "direct";
    const slate_id = d.slate_id ?? null;
    await send("reco_view", { plc, rail, src_pid, slate_id });
  });

  if (DEBUG) {
    globalThis.__swpx = {
      send,
      getLastSourceProductId,
      saveSourceProductId,
      getSessionId,
    };
    log("debug ON • pure tracking mode active (sandbox-safe)");
  }
});
