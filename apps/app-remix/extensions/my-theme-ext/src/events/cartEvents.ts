// src/events/cartEvents.ts

/**
 * Shopwizer Cart Events
 * --------------------
 * Observes all Shopify cart endpoints (/cart/add, /cart/update, etc.)
 * and dispatches unified custom events:
 *   - "SW:add"
 *   - "SW:update"
 *   - "SW:change"
 *   - "SW:clear"
 *   - "SW:mutate"
 *
 * Safe to import multiple times and works with both fetch() and XHR.
 */

(function () {
  if (typeof window === "undefined") return;

  // Debug utility - checks ?swdebug=1 or localStorage.swdebug
  const isDebug = (() => {
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const urlDebug = urlParams.get("swdebug");
      if (urlDebug === "1") {
        localStorage.setItem("swdebug", "1");
        return true;
      } else if (urlDebug === "0") {
        localStorage.removeItem("swdebug");
        return false;
      }
      return localStorage.getItem("swdebug") === "1";
    } catch {
      return false;
    }
  })();

  const log = (...args: any[]) => {
    if (isDebug) console.log("🔧 [CartEvents]", ...args);
  };

  const warn = (...args: any[]) => {
    if (isDebug) console.warn("🔧 [CartEvents]", ...args);
  };

  log("🚀 Initializing cart event interceptors...");

  if ((window as any).__ShopwiseCartEventsLoaded__) {
    log("⏭️ Already loaded, skipping");
    return;
  }
  (window as any).__ShopwiseCartEventsLoaded__ = true;

  const CartEvents = {
    add: "SW:add",
    update: "SW:update",
    change: "SW:change",
    clear: "SW:clear",
    mutate: "SW:mutate",
  };

  const ShopifyCartURLs = [
    "/cart/add",
    "/cart/update",
    "/cart/change",
    "/cart/clear",
    "/cart/add.js",
    "/cart/update.js",
    "/cart/change.js",
    "/cart/clear.js",
  ];

  function isShopifyCartURL(url: any) {
    if (!url) return false;
    try {
      const parsed = new URL(url, window.location.origin);
      return ShopifyCartURLs.some((p) => parsed.pathname.startsWith(p));
    } catch {
      // fallback for relative paths
      return ShopifyCartURLs.some((p) => url.startsWith(p));
    }
  }

  function updateType(url: string) {
    if (!url) return false;
    if (url.includes("cart/add")) return "add";
    if (url.includes("cart/update")) return "update";
    if (url.includes("cart/change")) return "change";
    if (url.includes("cart/clear")) return "clear";
    return false;
  }

  function dispatchEvent(url: string, detail: any) {
    log("📡 dispatchEvent called for URL:", url);

    if (typeof detail === "string") {
      try {
        detail = JSON.parse(detail);
      } catch {
        /* ignore */
      }
    }

    log("📤 Dispatching SW:mutate event");
    window.dispatchEvent(new CustomEvent(CartEvents.mutate, { detail }));

    const type = updateType(url);
    if (!type) {
      warn("⚠️ No matching cart type for URL");
      return;
    }

    log("📤 Dispatching SW:" + type + " event");
    window.dispatchEvent(new CustomEvent((CartEvents as any)[type], { detail }));
  }

  function XHROverride() {
    // Skip if ThemeBridge already patched
    if ((window as any).__swXHRPatched) {
      log("⏭️ XHR already patched by ThemeBridge, skipping");
      return;
    }

    if (!window.XMLHttpRequest) {
      warn("❌ XMLHttpRequest not available");
      return;
    }

    log("🔧 Installing XHR interceptor...");
    const originalOpen = window.XMLHttpRequest.prototype.open;
    window.XMLHttpRequest.prototype.open = function (...args: any[]) {
      const url = args[1];
      this.addEventListener("load", function () {
        if (isShopifyCartURL(url)) {
          log("🔍 XHR intercepted cart request:", url);
          dispatchEvent(url, (this as any).response);
        }
      });
      return originalOpen.apply(this, args as any);
    };
    log("✅ XHR interceptor installed");
  }

  function fetchOverride() {
    // Skip if ThemeBridge already patched
    if ((window as any).__swFetchPatched) {
      log("⏭️ Fetch already patched by ThemeBridge, skipping");
      return;
    }

    if (!window.fetch || typeof window.fetch !== "function") {
      warn("❌ fetch not available");
      return;
    }

    log("🔧 Installing fetch interceptor...");
    const originalFetch = window.fetch;
    window.fetch = function (...args: any[]) {
      const url = args[0];

      // Log cart-related fetch requests
      if (typeof url === "string" && url.includes("cart")) {
        log("👀 Saw fetch to cart-related URL:", url);
      }

      const response = originalFetch.apply(this, args as any);

      if (isShopifyCartURL(url)) {
        log("🔍 Fetch intercepted cart request:", url);
        response.then((res) => {
          log("📬 Fetch response received for:", res.url);
          res
            .clone()
            .json()
            .then((data) => {
              log("📦 Response data:", data);
              dispatchEvent(res.url, data);
            })
            .catch((err) => {
              warn("⚠️ JSON parse failed, trying text:", err);
              // fallback: try text response
              res
                .clone()
                .text()
                .then((text) => dispatchEvent(res.url, text));
            });
        }).catch((err) => {
          console.error("🔧 [CartEvents] ❌ Fetch failed:", err);
        });
      }

      return response;
    };
    log("✅ Fetch interceptor installed");
  }

  fetchOverride();
  XHROverride();

  log("✅ Cart event interceptors ready! Listening for cart mutations...");
})();
