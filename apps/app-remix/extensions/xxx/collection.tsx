/** @jsxImportSource preact */
import { h, render } from "preact";
import { useEffect, useMemo, useRef, useState } from "preact/hooks";

/* ============================================================================
   DEBUGGING HELPER
============================================================================ */
function debug(label: string, data?: any) {
  console.log(
    `%c[SW:COLLECTION] ${label}`,
    "color:#4A90E2; font-weight:bold;",
    data ?? "",
  );
}

/* ============================================================================
   HELPERS
============================================================================ */
const toCamel = (s: string) =>
  s.replace(/^data-/, "").replace(/-([a-z])/g, (_, c) => c.toUpperCase());

const parseBool = (v: any) =>
  typeof v === "string" ? v === "true" : Boolean(v);

const fmtMoney = new Intl.NumberFormat("en-ZA", {
  style: "currency",
  currency: "ZAR",
});

function publishRecommendationEvent(event: string, data: any = {}) {
  try {
    debug("publishRecommendationEvent", { event, data });
    window.Shopify?.analytics?.publish?.(event, data);
  } catch (err) {
    console.warn("[SW:COLLECTION] Failed to publish event", event, err);
  }
}

function publishRecommendationClick(
  productId: any,
  variantId: any,
  placement: any,
  rail: any,
  srcCollection: any,
  slate_id: any,
) {
  try {
    debug("recommendation_click", {
      productId,
      variantId,
      placement,
      rail,
      srcCollection,
      slate_id,
    });

    window.Shopify?.analytics?.publish?.("recommendation_clicked", {
      productId,
      variantId,
      placement,
      rail,
      srcCollection,
      slate_id,
    });
  } catch (err) {
    console.warn("[SW:COLLECTION] Failed to publish click", err);
  }
}

/* ============================================================================
   FETCH HELPERS
============================================================================ */
const productCache = new Map();

async function fetchProduct(handle: string) {
  const url = `/products/${encodeURIComponent(handle)}.js`;

  if (!productCache.has(url)) {
    productCache.set(
      url,
      fetch(url)
        .then(async (r) => {
          if (!r.ok) throw new Error(`${r.status} for ${url}`);
          debug("Fetched product JSON", { handle, status: r.status });
          return r.json();
        })
        .catch((err) => {
          debug("FAILED product fetch", { handle, err });
          throw err;
        }),
    );
  }

  return productCache.get(url);
}

/* ============================================================================
   UI COMPONENTS
============================================================================ */
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
            debug("CardClick", { productId: p.id });

            onCardClick(p.id, settings.recommender);

            publishRecommendationClick(
              p.id,
              p.vid ?? null,
              settings.placement,
              settings.recommender,
              settings.collectionId,
              slate_id,
            );
          }}
        />
      ))}
    </div>
  );
}

/* ============================================================================
   MAIN COMPONENT
============================================================================ */
function App({ el }) {
  /* SETTINGS PARSE --------------------------------------------------------- */
  const [settings] = useState(() =>
    Object.fromEntries(
      Array.from(el.attributes, (a) => [toCamel(a.name), a.value]),
    ),
  );

  debug("Parsed settings", settings);

  /* STATE */
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [slateId, setSlateId] = useState(null);

  const elRef = useRef(null);
  const observerRef = useRef(null);

  const collectionId = settings.collectionId;
  const collectionHandle = settings.collectionHandle;

  /* LOAD PRODUCTS ---------------------------------------------------------- */
  useEffect(() => {
    async function load() {
      try {
        setLoading(true);

        const limit = Math.max(1, Number(settings.productsToShow || 8));
        const endpointId = collectionHandle;

        debug("Load triggered", {
          endpointId,
          recommender: settings.recommender,
        });

        if (!endpointId) throw new Error("Missing collection context");

        console.log(
          "const apiUrl = `/apps/sw/col/${settings.recommender}/${endpointId}`: ",
          `${settings.recommender}/${endpointId}`,
        );

        const apiUrl = `/apps/sw/col/${settings.recommender}/${endpointId}`;
        debug("Fetching API", apiUrl);

        const res = await fetch(apiUrl);
        if (!res.ok) throw new Error(`API ${res.status}`);

        const data = await res.json();
        debug("Raw API response", data);

        const handles = (data.results || []).map((r) => r.handle);
        debug("Handles received", handles);

        const slate_id = data.slate_id;
        setSlateId(slate_id);

        /* FETCH product JSONs */
        const settled = await Promise.allSettled(
          handles.slice(0, limit + 6).map(async (h) => {
            const pd = await fetchProduct(h);

            const variantId = pd.variants?.[0]?.id ?? null;
            const img = pd.featured_image || pd.images?.[0];

            return {
              id: pd.id,
              vid: variantId,
              title: pd.title,
              vendor: pd.vendor,
              url: `/products/${pd.handle}`,
              image: img ? { src: img, alt: pd.title } : null,
              price: Number(pd.price || pd.variants?.[0]?.price),
              compare_at_price: Number(
                pd.compare_at_price || pd.variants?.[0]?.compare_at_price,
              ),
            };
          }),
        );

        const valid = settled
          .map((r) => (r.status === "fulfilled" ? r.value : null))
          .filter(Boolean)
          .slice(0, limit);

        debug("Final mapped products", valid);

        setProducts(valid);

        publishRecommendationEvent("recommendation_loaded", {
          rail: settings.recommender,
          plc: settings.placement,
          src_collection: endpointId,
          slate_id: slate_id,
        });
      } catch (err) {
        console.error("[ShopwizerReco] Load error", err);
        setProducts([]);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [settings.productsToShow]);

  /* VIEWED EVENT ----------------------------------------------------------- */
  useEffect(() => {
    if (!elRef.current || !products.length) return;

    debug("Setting up view observer", { count: products.length });

    if (observerRef.current) {
      try {
        observerRef.current.disconnect();
      } catch {}
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          debug("Widget viewed", {
            rail: settings.recommender,
            slate_id: slateId,
          });

          publishRecommendationEvent("recommendation_viewed", {
            rail: settings.recommender,
            plc: settings.placement,
            src_collection: settings.collectionId,
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
    };
  }, [products, slateId]);

  /* RENDER BODY ------------------------------------------------------------ */
  const body = useMemo(() => {
    if (loading) {
      debug("Rendering skeletons…");

      const count = Number(settings.productsToShow) || 8;
      return (
        <div
          class="reco__track"
          role="list"
          style={`--reco-cols:${settings.gridColumnsDesktop || 4};`}
        >
          {Array.from({ length: count }).map((_, i) => (
            <article key={i} class="reco__card reco__skeleton">
              <div class="reco__media-skel" />
              <div class="reco__line-skel" style="width:80%" />
              <div class="reco__line-skel" style="width:40%" />
            </article>
          ))}
        </div>
      );
    }

    if (!products.length) {
      debug("No products available");
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
        onCardClick={() => {}}
      />
    );
  }, [products, loading, settings, slateId]);

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
      {settings.heading ? (
        <h2
          className={`${settings.headingSize || ""} sw_rec_heading`}
          dangerouslySetInnerHTML={{ __html: settings.heading }}
        />
      ) : null}

      {body}
    </div>
  );
}

/* ============================================================================
   MOUNT
============================================================================ */
(function () {
  const MOUNT_SELECTOR = '[id^="shopwise-collection-"]';

  function mount(root = document) {
    debug("Mount triggered");

    root.querySelectorAll(MOUNT_SELECTOR).forEach((el) => {
      if (el.dataset.mounted === "true") return;
      el.dataset.mounted = "true";

      debug("Mounting widget", { el });
      render(<App el={el} />, el);
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => mount());
  } else {
    mount();
  }

  document.addEventListener("shopify:section:load", (e) => { 
    debug("Section reload", e.target);
    mount(e.target);
  });
})();
