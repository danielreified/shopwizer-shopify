/** @jsxImportSource preact */
import { h, render } from "preact";
import { useEffect, useMemo, useRef, useState } from "preact/hooks";
import "../my-theme-ext/src/events/cartEvents";
import "../my-theme-ext/src/events/variantObserver";

/* --------------------------------------------------------------
   CART ATTRIBUTION HANDLER (production-grade)
-------------------------------------------------------------- */
(function () {
  if (typeof window === "undefined") return;
  if (window.__shopwise_attrib_listener__) return;

  window.__shopwise_attrib_listener__ = true;

  const ATTR_KEY = "__shopwise_attrib__v1";

  // snapshot cart BEFORE add
  window.addEventListener("SW:mutate", async () => {
    try {
      const cart = await fetch("/cart.js").then((r) => r.json());
      window.__shopwise_cart_before__ = cart.items || [];
    } catch {
      window.__shopwise_cart_before__ = [];
    }
  });

  async function patchCart(payload) {
    // retry logic (handles fast drawer rewrites)
    for (let i = 0; i < 3; i++) {
      try {
        await fetch("/cart/change.js", {
          method: "POST", 
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        return true;
      } catch (e) {
        await new Promise((r) => setTimeout(r, 150 * (i + 1)));
      }
    }
  }

  window.addEventListener("SW:add", async () => {
    let before = window.__shopwise_cart_before__ || [];

    let cart;
    try {
      cart = await fetch("/cart.js").then((r) => r.json());
    } catch {
      return;
    }

    const after = cart.items || [];

    // find NEW line items
    const newItems = after.filter((a) => !before.some((b) => b.key === a.key));

    if (!newItems.length) return;

    for (const addedItem of newItems) {
      const attributions = JSON.parse(localStorage.getItem(ATTR_KEY) || "[]");
      const record = attributions.find(
        (r) => String(r.pid) === String(addedItem.product_id),
      );

      // nothing to attribute
      if (!record) {
        continue;
      }

      // avoid double tagging
      if (addedItem.properties?._shopwise) {
        continue;
      }

      const updatedProps = {
        ...addedItem.properties,
        _shopwise: "Recommended by Shopwizer",
      };

      await patchCart({
        id: addedItem.key,
        quantity: addedItem.quantity,
        properties: updatedProps,
      });

      console.debug("[ShopwiseReco] 🧩 Attribution patched", updatedProps);
    }
  });
})();

/* --------------------------------------------------------------
    HELPERS
  -------------------------------------------------------------- */
const toCamel = (s) =>
  s.replace(/^data-/, "").replace(/-([a-z])/g, (_, c) => c.toUpperCase());
const parseBool = (v) => (typeof v === "string" ? v === "true" : Boolean(v));
const fmtMoney = new Intl.NumberFormat("en-ZA", {
  style: "currency",
  currency: "ZAR",
});

/* --------------------------------------------------------------
    ATTRIBUTION CACHE (30 days)
  -------------------------------------------------------------- */
const ATTR_KEY = "__shopwise_attrib__v1";
const TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days
const MAX_ATTR = 50;

function getAttributions() {
  try {
    const now = Date.now();
    const list = JSON.parse(localStorage.getItem(ATTR_KEY) || "[]")
      .filter((r) => now - r.ts < TTL_MS)
      .slice(-MAX_ATTR);
    localStorage.setItem(ATTR_KEY, JSON.stringify(list));
    return list;
  } catch {
    return [];
  }
}

function recordAttribution(pid, type) {
  const list = getAttributions();
  const now = Date.now();
  const found = list.find((r) => r.pid === pid);
  if (found) found.ts = now;
  else list.push({ pid, type, ts: now });
  localStorage.setItem(ATTR_KEY, JSON.stringify(list.slice(-MAX_ATTR)));
}

/* --------------------------------------------------------------
    RECENTLY VIEWED CACHE (10 latest)
  -------------------------------------------------------------- */
const RECENT_KEY = "__shopwise_recent__v1";
const RECENT_MAX = 10;

function getRecentlyViewed() {
  try {
    const list = JSON.parse(localStorage.getItem(RECENT_KEY) || "[]");
    return list.slice(-RECENT_MAX).reverse();
  } catch {
    return [];
  }
}

function recordRecentlyViewed(pid, handle) {
  try {
    if (!pid && !handle) return;
    const now = new Date().toISOString();
    const sid = window.__shopwise_sid__;
    const list = getRecentlyViewed().filter((r) => r.pid !== pid);
    list.push({ pid, handle, ts: Date.now(), sid });
    localStorage.setItem(RECENT_KEY, JSON.stringify(list.slice(-RECENT_MAX)));
    console.log("[ShopwiseReco] ✅ Added to RECENT", {
      pid,
      handle,
      now,
      sid,
      list,
    });
  } catch (err) {
    console.warn("[ShopwiseReco] Failed to store recent product", err);
  }
}

/* --------------------------------------------------------------
    SESSION ID (Shared across Pixel + Reco)
  -------------------------------------------------------------- */
const SW_SESSION_KEY = "__shopwise_sid__";
const SW_SESSION_TTL = 30 * 60 * 1000; // 30 minutes

function getOrCreateSessionId() {
  try {
    const now = Date.now();
    const raw = localStorage.getItem(SW_SESSION_KEY);
    let sid, ts;

    if (raw) {
      const data = JSON.parse(raw);
      sid = data.sid;
      ts = data.ts;
    }

    if (!sid || now - ts > SW_SESSION_TTL) {
      sid = crypto.randomUUID();
      ts = now;
    }

    localStorage.setItem(SW_SESSION_KEY, JSON.stringify({ sid, ts: now }));
    return sid;
  } catch {
    return crypto.randomUUID();
  }
}

window.__shopwise_sid__ = getOrCreateSessionId();
window.dispatchEvent(
  new CustomEvent("shopwise:session", {
    detail: { sid: window.__shopwise_sid__ },
  }),
);
console.debug("[ShopwiseReco] Session initialized:", window.__shopwise_sid__);

/* --------------------------------------------------------------
    SOURCE PRODUCT CONTEXT + CROSS-PAGE ATTRIBUTION
  -------------------------------------------------------------- */
const ATTR_SRC_KEY = "__shopwise_src_pid__";

function getSourceProductId(el) {
  const attr = el?.getAttribute?.("data-source-product-id");
  if (attr) return attr;
  if (typeof window !== "undefined" && window?.meta?.product?.id)
    return window.meta.product.id;
  return null;
}

function saveSourceProductId(pid) {
  try {
    localStorage.setItem(ATTR_SRC_KEY, JSON.stringify({ pid, ts: Date.now() }));
  } catch {}
}

function getLastSourceProductId() {
  try {
    const raw = localStorage.getItem(ATTR_SRC_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw);
    if (Date.now() - data.ts > 10 * 60 * 1000) return null;
    return data.pid;
  } catch {
    return null;
  }
}

/* --------------------------------------------------------------
    PRODUCT META RESOLVER
  -------------------------------------------------------------- */
function getShopifyProductMeta(settings) {
  try {
    // ✅ Prefer Liquid-injected values
    if (settings.productId || settings.productHandle) {
      return {
        id: settings.productId || null,
        handle: settings.productHandle || null,
      };
    }

    // fallback 1: window.meta
    if (window.meta?.product?.id) return window.meta.product;

    // fallback 2: ShopifyAnalytics
    if (window.ShopifyAnalytics?.meta?.product)
      return window.ShopifyAnalytics.meta.product;

    // fallback 3: parse from URL
    const match = window.location.pathname.match(/\/products\/([^/?#]+)/);
    if (match) return { id: null, handle: match[1] };

    return null;
  } catch (err) {
    console.warn("[ShopwiseReco] Failed to resolve product meta", err);
    return null;
  }
}

/* --------------------------------------------------------------
    FETCH HELPERS
  -------------------------------------------------------------- */
const productCache = new Map();

async function fetchProduct(handle) {
  const url = `/products/${encodeURIComponent(handle)}.js`;
  if (!productCache.has(url)) {
    productCache.set(
      url,
      fetch(url).then(async (r) => {
        if (!r.ok) throw new Error(`${r.status} for ${url}`);
        return r.json();
      }),
    );
  }
  return productCache.get(url);
}

/* --------------------------------------------------------------
    ANALYTICS HELPERS
  -------------------------------------------------------------- */
function publishRecommendationClick(
  productId,
  variantId,
  placement,
  rail,
  srcPid,
  slate_id,
) {
  try {
    window.Shopify?.analytics?.publish?.("recommendation_clicked", {
      productId,
      variantId,
      placement,
      rail,
      srcPid,
      slate_id,
    });
    console.debug("[ShopwiseReco] Published recommendation_clicked", {
      productId,
      variantId,
      placement,
      rail,
      slate_id,
    });
  } catch (err) {
    console.warn(
      "[ShopwiseReco] Failed to publish recommendation_clicked",
      err,
    );
  }
}

function publishRecommendationEvent(event, data = {}) {
  try {
    window.Shopify?.analytics?.publish?.(event, data);
    console.debug(`[ShopwiseReco] Published ${event}`, data);
  } catch (err) {
    console.warn(`[ShopwiseReco] Failed to publish ${event}`, err);
  }
}

/* --------------------------------------------------------------
    UI COMPONENTS
  -------------------------------------------------------------- */
  function Card({ product, showVendor, imageRatio, onClick }) {
    return (
      <article class="reco__card" role="listitem">
  
        {product.image?.src && (
          <a
            class="reco__media"
            href={product.url}
            aria-label={product.title}
            style={`aspect-ratio:${imageRatio || "1/1"};`}
            onClick={onClick}
          >
            <img
              src={product.image.src}
              alt={product.image.alt || product.title || ""}
              loading="lazy"
            />
          </a>
        )}
  
        <div class="reco__body">
          {product.title && (
            <h3 class="reco__title">
              <a href={product.url} onClick={onClick}>
                {product.title}
              </a>
            </h3>
          )}
  
          {showVendor && product.vendor && (
            <div class="reco__vendor">{product.vendor}</div>
          )}
  
          {typeof product.price === "number" && (
            <div class="reco__price">
              {fmtMoney.format(product.price / 100)}
              {product.compare_at_price > product.price && (
                <span class="reco__price-compare">
                  {fmtMoney.format(product.compare_at_price / 100)}
                </span>
              )}
            </div>
          )}
        </div>
      </article>
    );
  }  

function Grid({ products, settings, onCardClick, slate_id }) {
  const cols = settings.gridColumnsDesktop || 4;
  return (
    <div class="reco__track" role="list" style={`--reco-cols:${cols};`}>
      {products.map((p) => (
        <Card
          key={p.id}
          product={p}
          showVendor={parseBool(settings.showVendor)}
          imageRatio={settings.imageRatio}
          onClick={() => {
            const currentPid = getSourceProductId(document.body);
            if (currentPid) saveSourceProductId(currentPid);

            onCardClick(p.id, settings.recommender || "reco");

            setTimeout(() => {
              const srcPid =
                getSourceProductId(document.body) ||
                getLastSourceProductId() ||
                null;

              publishRecommendationClick(
                p.id,
                p.vid ?? null,
                settings.placement,
                settings.recommender,
                srcPid,
                slate_id,
              );
            }, 0);
          }}
        />
      ))}
    </div>
  );
}

/* --------------------------------------------------------------
    MAIN COMPONENT
  -------------------------------------------------------------- */
function App({ el }) {
  const [settings] = useState(() =>
    Object.fromEntries(
      Array.from(el.attributes, (a) => [toCamel(a.name), a.value]),
    ),
  );
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [slateId, setSlateId] = useState(null);
  const [variantId, setVariantId] = useState(settings.variantId || null);
  const elRef = useRef(null);
  const observerRef = useRef(null);

  useEffect(() => {
    const onVariant = (e) => {
      const vid = e.detail?.variantId;
      if (vid) setVariantId(String(vid));
    };
  
    document.addEventListener("shopwise:variant", onVariant);
    return () => document.removeEventListener("shopwise:variant", onVariant);
  }, []);
  

  useEffect(() => {
    const limit = Math.max(1, Number(settings.productsToShow || 8));
    console.log("settings:", settings);

    async function load() {
      try {
        setLoading(true);

        // 🧠 Record "recently viewed" when on product page
        const meta = getShopifyProductMeta(settings);
        const productId = settings?.productId || null;
        const handle = settings?.productHandle || null;
        console.log("[ShopwiseReco] Product context:", meta);

        if (productId && handle) recordRecentlyViewed(productId, handle);

        // 🆕 Local-only rail
        if (settings.recommender === "recent") {
          console.debug("[ShopwiseReco] Loading recently viewed products...");

          const recents = getRecentlyViewed()
            .filter((r) => r.pid !== productId && r.handle !== handle)
            .slice(0, limit);
          if (!recents.length) {
            console.debug("[ShopwiseReco] No recent products found.");
            setProducts([]);
            return;
          }

          const settled = await Promise.allSettled(
            recents.map(async (r) => {
              try {
                const pd = await fetchProduct(r.handle);
                const variantId = pd.variants?.[0]?.id ?? null;
                const img = pd.featured_image || pd.images?.[0];
                const price = Number(pd.price || pd.variants?.[0]?.price);
                const compare = Number(
                  pd.compare_at_price || pd.variants?.[0]?.compare_at_price,
                );
                return {
                  id: pd.id,
                  vid: variantId,
                  title: pd.title,
                  vendor: pd.vendor,
                  url: `/products/${pd.handle}`,
                  image: img ? { src: img, alt: pd.title } : null,
                  price: Number.isFinite(price) ? price : null,
                  compare_at_price: Number.isFinite(compare) ? compare : null,
                };
              } catch (err) {
                console.warn(
                  "[ShopwiseReco] Skipping product (recent)",
                  r.handle,
                  err?.message || err,
                );
                return null;
              }
            }),
          );

          const valid = settled
            .map((r) => (r.status === "fulfilled" ? r.value : null))
            .filter(Boolean)
            .slice(0, limit);

          setProducts(valid);

          publishRecommendationEvent("recommendation_loaded", {
            rail: "recently-viewed",
            plc: el.dataset.placement || "widget",
            src_pid: getSourceProductId(el) || getLastSourceProductId() || null,
            slate_id: null,
          });

          return; // ✅ stop here for local-only rail
        }

        // 🟢 Default path — fetch from app proxy
        const domain = Shopify.shop;
        if (!domain || !productId) throw new Error("Missing Shopify context");

        let endpointId = productId;

        if (settings.recommender === "color" && variantId) {
          endpointId = variantId;
        }

        const res = await fetch(`/apps/sw/recs/${settings.recommender}/${endpointId}`);

        if (!res.ok) throw new Error(`API ${res.status}`);

        const data = await res.json();
        const handles = (data.results || []).map((r) => r.handle);
        const slate_id = data.slate_id;
        setSlateId(slate_id);

        if (!handles.length) throw new Error("No recommendation handles");

        const settled = await Promise.allSettled(
          handles.slice(0, limit + 6).map(async (h) => {
            try {
              const pd = await fetchProduct(h);
              const variantId = pd.variants?.[0]?.id ?? null;
              const img = pd.featured_image || pd.images?.[0];
              const price = Number(pd.price || pd.variants?.[0]?.price);
              const compare = Number(
                pd.compare_at_price || pd.variants?.[0]?.compare_at_price,
              );
              return {
                id: pd.id,
                vid: variantId,
                title: pd.title,
                vendor: pd.vendor,
                url: `/products/${pd.handle}`,
                image: img ? { src: img, alt: pd.title } : null,
                price: Number.isFinite(price) ? price : null,
                compare_at_price: Number.isFinite(compare) ? compare : null,
              };
            } catch (err) {
              console.warn(
                "[ShopwiseReco] Skipping product",
                h,
                err?.message || err,
              );
              return null;
            }
          }),
        );

        const valid = settled
          .map((r) => (r.status === "fulfilled" ? r.value : null))
          .filter(Boolean)
          .slice(0, limit);

        setProducts(valid);

        publishRecommendationEvent("recommendation_loaded", {
          rail: el.dataset.recommender || "related",
          plc: el.dataset.placement || "widget",
          src_pid: getSourceProductId(el) || getLastSourceProductId() || null,
          slate_id,
        });
      } catch (e) {
        console.error("[ShopwiseReco] Failed to load products", e);
        setProducts([]);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [settings.productsToShow, variantId]);

  useEffect(() => {
    if (!elRef.current) return;

    if (observerRef.current) {
      try {
        observerRef.current.disconnect();
      } catch {}
    }

    if (!products.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          const srcPid =
            getSourceProductId(el) || getLastSourceProductId() || null;
          const pid = products?.[0]?.id ?? srcPid ?? null;

          publishRecommendationEvent("recommendation_viewed", {
            rail: el.dataset.recommender || "related",
            plc: el.dataset.placement || "widget",
            pid,
            src_pid: getSourceProductId(el) || getLastSourceProductId() || null,
            slate_id: slateId,
          });

          observer.disconnect();
          observerRef.current = null;
        }
      },
      { threshold: 0.5 },
    );

    observer.observe(elRef.current);
    observerRef.current = observer;

    return () => {
      try {
        observer.disconnect();
      } catch {}
      observerRef.current = null;
    };
  }, [products, slateId]);

  const body = useMemo(() => {
    if (loading) {
      const count = Number(settings.productsToShow) || 8;
      return (
        <div
          class="reco__track"
          role="list"
          style={`--reco-cols:${settings.gridColumnsDesktop || 4};`}
        >
          {Array.from({ length: count }, (_, i) => (
            <article
              key={i}
              class="reco__card reco__skeleton"
              aria-hidden="true"
            >
              <div class="reco__media-skel" />
              <div class="reco__line-skel" style="width:80%" />
              <div class="reco__line-skel" style="width:40%" />
            </article>
          ))}
        </div>
      );
    }

    if (!products.length) {
      return (
        <div
          class="reco__track"
          role="list"
          style={`--reco-cols:${settings.gridColumnsDesktop || 4};`}
        >
          <div class="reco__empty" style="opacity:.7;padding:8px;">
            No recommendations found.
          </div>
        </div>
      );
    }

    return (
      <Grid
        products={products}
        settings={settings}
        slate_id={slateId}
        onCardClick={(id, type) => recordAttribution(String(id), type)}
      />
    );
  }, [products, loading, settings, slateId]);

  const headingText = settings.heading;

  return (
    <div
      ref={elRef}
      class="sw-rec__wrapper"
      style={{
        "--grid-text-alignment": settings.gridTextAlignment || "left",
        "--grid-padding-top": `${settings.gridPaddingTop || 0}px`,
        "--grid-padding-bottom": `${settings.gridPaddingBottom || 0}px`,
      }}
    >
      <h2
        className={`${settings.headingSize || ""} sw_rec_heading`}
        dangerouslySetInnerHTML={{ __html: headingText }}
      />
      {body}
    </div>
  );
}

/* --------------------------------------------------------------
    MOUNT (Scoped + Multi-instance Safe)
  -------------------------------------------------------------- */
const ShopwiseReco = (function () {
  const MOUNT_SELECTOR = '[id^="shopwise-reco-"]';

  function mount(root = document) {
    root.querySelectorAll(MOUNT_SELECTOR).forEach((el) => {
      if (el.dataset.mounted === "true") return;
      el.dataset.mounted = "true";
      render(<App el={el} />, el);
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => mount());
  } else {
    mount();
  }

  document.addEventListener("shopify:section:load", (e) => mount(e.target));
})();
