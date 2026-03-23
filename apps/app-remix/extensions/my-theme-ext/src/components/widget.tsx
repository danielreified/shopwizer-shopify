// src/components/widget.tsx

/** @jsxImportSource preact */
import { h } from "preact";
import { useState, useMemo, useEffect, useRef } from "preact/hooks";
import { Grid } from "../ui/grid";
import { QuickBuyModal } from "../ui/QuickBuyModal";

import { extractSettings } from "../core/utils/dom";
import { recordAttribution } from "../core/attribution/cache";
import { initCartAttribution } from "../core/attribution/cartAttribution";
import { publishViewed, publishClicked } from "../core/analytics/index";
import { observeViewOnce } from "../core/analytics/viewObserver";

import { Heading } from "../ui/heading";

import { createDebugger } from "../core/utils/debug";

const debug = createDebugger("[WIDGET]: ", false);

// Initialize cart attribution listener (runs once per page load)
initCartAttribution();

export function Widget({ el, loader }: { el: HTMLElement, loader: (settings: any) => Promise<any> }) {
  debug.log("🟦 [WIDGET] MOUNT on element:", el);

  const [settings] = useState(() => {
    const s = extractSettings(el);

    debug.log("🟦 [WIDGET] Final settings:", s);
    return s;
  });

  const [products, setProducts] = useState<any[]>([]);
  const [integrations, setIntegrations] = useState<{ wishlist?: string; reviews?: string }>({});
  const [slateId, setSlateId] = useState<string | undefined>(undefined);
  const [payload, setPayload] = useState<string | undefined>(undefined);
  const [sourcePayload, setSourcePayload] = useState<string | undefined>(undefined);
  const [loading, setLoading] = useState(true);

  // Quick Buy Modal state
  const [quickBuyProduct, setQuickBuyProduct] = useState<any>(null);

  const mountRef = useRef(null);

  useEffect(() => {
    let active = true;

    async function run() {
      try {
        setLoading(true);

        const { products, slate_id, p, ps, integrations } = await loader(settings);
        if (!active) return;

        setProducts(products || []);
        setSlateId(slate_id || undefined);
        setPayload(p || undefined);
        setSourcePayload(ps || undefined);
        setIntegrations(integrations || {});

        // NOTE: reco_view is now ONLY fired when the widget enters viewport
        // via the IntersectionObserver in the second useEffect below.
        // This prevents double-counting impressions.
      } catch (err) {
        debug.warn("🟥 loader failed:", err);
        if (active) setProducts([]);
      } finally {
        if (active) setLoading(false);
      }
    }

    run();
    return () => (active = false);
  }, [settings.recommender, settings.productsToShow]);

  useEffect(() => {
    if (!mountRef.current || !products.length) return;

    observeViewOnce(mountRef.current, () => {
      publishViewed({
        rail: settings.recommender,
        placement: settings.placement || "widget",
        slateId: slateId,
      });
    });
  }, [products, slateId, payload, sourcePayload]);

  // If no products after loading, render nothing at all
  if (!loading && !products.length) {
    return null;
  }

  const body = useMemo(() => {
    return (
      <Grid
        products={products}
        settings={{ ...settings, integrations }}
        isLoading={loading}
        onClick={(prod) => {
          recordAttribution(prod.id, settings.recommender);
          publishClicked({
            rail: settings.recommender,
            placement: settings.placement,
            productId: prod.id,
            srcPid: settings.productId,  // Source product (the one being viewed)
            slateId: slateId,
            p: payload || undefined,
            ps: sourcePayload || undefined,
          });
        }}
        onQuickBuy={(prod) => {
          setQuickBuyProduct(prod);
          publishClicked({
            rail: settings.recommender,
            placement: settings.placement,
            productId: prod.id,
            srcPid: settings.productId,
            slateId: slateId,
            action: 'quick_buy_open',
          });
        }}
      />
    );
  }, [products, loading, settings, slateId, integrations]);

  return (
    <section
      className="sw-section"
      style={{
        "--pad-top-desktop": `${settings.padTopDesktop || 24}px`,
        "--pad-bottom-desktop": `${settings.padBottomDesktop || 24}px`,
        "--pad-top-mobile": `${settings.padTopMobile || 16}px`,
        "--pad-bottom-mobile": `${settings.padBottomMobile || 16}px`,
      } as any}
    >
      <div
        ref={mountRef}
        className="sw-rec__wrapper"
        style={{
          "--gap-grid-x": `${settings.desktopGapX || 16}px`,
          "--gap-grid-y": `${settings.desktopGapY || 24}px`,
          "--carousel-gap": `${settings.mobileGap || 12}px`,
          "--heading-spacing-desktop": `${settings.headingSpacingDesktop || 16}px`,
          "--heading-spacing-mobile": `${settings.headingSpacingMobile || 12}px`,
          "--heading-alignment": settings.headingAlignment || "left",
        } as any}
      >
        {settings.headingTitle && (
          <Heading
            text={settings.headingTitle}
            tag={settings.headingTag || "h3"}
            size={settings.headingSize || "medium"}
            alignment={settings.headingAlignment || "left"}
          />
        )}

        <div
          className="sw-alignment-ref"
          aria-hidden="true"
          style={{
            height: "1px",
            visibility: "hidden",
            pointerEvents: "none",
          }}
        />

        {body}
      </div>

      {/* Quick Buy Modal */}
      {quickBuyProduct && (
        <QuickBuyModal
          product={quickBuyProduct}
          moneyFormat={settings.moneyFormat}
          onClose={() => setQuickBuyProduct(null)}
          onAddToCart={(variantId, quantity) => {
            publishClicked({
              rail: settings.recommender,
              placement: settings.placement,
              productId: quickBuyProduct.id,
              variantId,
              quantity,
              action: 'quick_buy_add',
            });
          }}
        />
      )}
    </section>
  );
}
