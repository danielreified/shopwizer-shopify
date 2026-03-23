// src/ui/grid.tsx

/** @jsxImportSource preact */
import { h } from "preact";
import { useRef, useEffect } from "preact/hooks";
import { Card } from "../ui/card";
import { createDebugger } from "../core/utils/debug";

const debug = createDebugger("Grid");

export function Grid({
  products = [],
  settings = {},
  onClick,
  onQuickBuy,
  isLoading = false,
}: {
  products?: any[];
  settings?: any;
  onClick?: (product: any) => void;
  onQuickBuy?: (product: any) => void;
  isLoading?: boolean;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const hasMoved = useRef(false);

  // -------------------------------
  // MAP SETTINGS FROM LIQUID
  // -------------------------------
  const cols = Number(settings.desktopColumns) || 4;
  const gapX = Number(settings.desktopGapX) || 16;
  const gapY = Number(settings.desktopGapY) || 24;
  const padTop = Number(settings.padTopDesktop) || 0;
  const padBottom = Number(settings.padBottomDesktop) || 0;
  const textAlign = settings.desktopTextAlign || "left";

  const isCarousel = settings.desktopLayout === "carousel";

  // -------------------------------
  // GENERATE SKELETON OR REAL PRODUCTS
  // -------------------------------
  const items = isLoading
    ? Array.from({ length: Number(settings.productsToShow) || 8 }, (_, i) => ({
      id: `skeleton-${i}`,
      skeleton: true,
    }))
    : products;

  if (!items.length) {
    return <div className="sw-grid">No products available.</div>;
  }

  // -------------------------------
  // WISHLIST APP REINITIALIZATION
  // -------------------------------
  // Generate a unique ID for this grid instance to target specifically
  const gridIdRef = useRef(`sw-grid-${Math.random().toString(36).slice(2, 9)}`);

  useEffect(() => {
    if (isLoading || !products.length) return;

    const win = window as any;
    const gridId = gridIdRef.current;

    // Function to initialize SWYM buttons within this specific grid
    const initSwymForGrid = (swat: any) => {
      if (!swat?.initializeActionButtons) return;

      // Target this specific grid by ID
      const container = document.getElementById(gridId);
      if (container) {
        swat.initializeActionButtons(`#${gridId}`);
      }
    };

    // Function to initialize all wishlist apps
    const initAllWishlistApps = () => {
      // SWYM
      if (win._swat) {
        initSwymForGrid(win._swat);
      }

      // Other wishlist apps
      try { win.Growave?.Wishlist?.init?.(); } catch (e) { }
      try { win.SmartWishlist?.init?.(); } catch (e) { }
      try { win.WishlistKing?.toolkit?.init?.(); } catch (e) { }
      try { win.HulkappWishlist?.init?.(); } catch (e) { }
      try { win.WishlistHero?.init?.(); } catch (e) { }

      document.dispatchEvent(new CustomEvent("shopify:section:load"));
    };

    // If SWYM is already loaded, initialize immediately with a small delay for DOM
    if (win._swat) {
      const timer = setTimeout(initAllWishlistApps, 100);
      return () => clearTimeout(timer);
    }

    // If SWYM is not loaded yet, register a callback
    if (win.SwymCallbacks) {
      const callback = (swat: any) => initSwymForGrid(swat);
      win.SwymCallbacks.push(callback);
    } else {
      // SwymCallbacks doesn't exist, wait for _swat
      const checkSwym = setInterval(() => {
        if (win._swat) {
          initAllWishlistApps();
          clearInterval(checkSwym);
        }
      }, 200);

      // Stop checking after 10 seconds
      const timeout = setTimeout(() => clearInterval(checkSwym), 10000);

      return () => {
        clearInterval(checkSwym);
        clearTimeout(timeout);
      };
    }
  }, [products, isLoading]);

  useEffect(() => {
    if (isLoading || !products.length) return;

    const initReviewApps = () => {
      const win = window as any;

      // Judge.me
      if (win.jdgm?.batchRenderBadges) {
        const allBadges = document.querySelectorAll(".jdgm-badge-placeholder");
        const handles = [
          ...new Set(
            [...allBadges].map((el) => el.getAttribute("data-handle")),
          ),
        ];
        const data = handles.map((handle) => ({
          productHandle: handle,
          badgePlaceholder: `.jdgm-badge-placeholder[data-handle="${handle}"]`,
        }));
        debug.log("Judge.me initialized for", data.length, "products");
        win.jdgm.batchRenderBadges(data);
        return;
      }

      if (win.JDGM?.initWidgets) {
        debug.log("Judge.me (new API) initialized");
        win.JDGM.initWidgets();
        return;
      }

      // Okendo
      if (win.okeWidgetApi?.initWidget) {
        document.querySelectorAll("[data-oke-star-rating]").forEach((el) => {
          try {
            win.okeWidgetApi.initWidget(el, true);
          } catch (e) {
            debug.warn("Okendo error", e);
          }
        });
        debug.log("Okendo initialized");
        return;
      }

      // Yotpo
      if (win.yotpoWidgetsContainer?.initWidgets) {
        win.yotpoWidgetsContainer.initWidgets();
      } else if (win.yotpo?.initWidgets) {
        win.yotpo.initWidgets();
      } else if (win.Yotpo?.initWidgets) {
        win.Yotpo.initWidgets();
      } else if (win.yotpo?.refreshWidgets) {
        win.yotpo.refreshWidgets();
      }

      // Stamped.io
      if (win.StampedFn?.reloadUGC) {
        debug.log("Stamped.io initialized");
        win.StampedFn.reloadUGC();
        return;
      }
    };

    const timer = setTimeout(initReviewApps, 500);

    return () => clearTimeout(timer);
  }, [products, isLoading]);

  // -------------------------------
  // DRAG FUNCTIONALITY (CAROUSEL ONLY)
  // -------------------------------
  useEffect(() => {
    // if (!isCarousel) return;

    const slider = scrollRef.current;
    if (!slider) return;

    const updateGutter = () => {
      let gutterLeft = 20;

      const alignmentRef = slider
        .closest(".sw-rec__wrapper")
        ?.querySelector(".sw-alignment-ref");
      if (alignmentRef) {
        const refRect = alignmentRef.getBoundingClientRect();
        gutterLeft = Math.max(20, refRect.left);
      } else {
        const heading = slider
          .closest(".sw-rec__wrapper")
          ?.querySelector(".sw-heading");
        if (heading) {
          const headingRect = heading.getBoundingClientRect();
          gutterLeft = Math.max(20, headingRect.left);
        }
      }

      slider.style.setProperty("--actual-gutter-left", `${gutterLeft}px`);
    };

    updateGutter();
    window.addEventListener("resize", updateGutter);

    const preventDragStart = (e: DragEvent) => {
      e.preventDefault();
      return false;
    };

    const images = slider.querySelectorAll("img");
    const links = slider.querySelectorAll("a");

    images.forEach((img) => {
      img.setAttribute("draggable", "false");
      img.addEventListener("dragstart", preventDragStart);
    });

    links.forEach((link) => {
      link.setAttribute("draggable", "false");
      link.addEventListener("dragstart", preventDragStart);
    });

    let isDown = false;
    let startX = 0;
    let scrollLeft = 0;
    let velocities: number[] = [];
    let lastX = 0;
    let lastTime = 0;
    let animationFrameId: number | null = null;
    let pendingScrollLeft: number | null = null;

    const handlePointerDown = (e: PointerEvent) => {
      const target = e.target as HTMLElement;
      if (
        target.closest(".sw-card__wishlist") ||
        target.closest(".swym-button")
      ) {
        return;
      }

      // Cancel any pending animation frame
      if (animationFrameId !== null) {
        cancelAnimationFrame(animationFrameId);
        animationFrameId = null;
      }

      startX = e.pageX;
      scrollLeft = slider.scrollLeft;
      lastX = e.pageX;
      lastTime = performance.now();
      velocities = [];
      hasMoved.current = false;
      isDown = true;
      slider.style.scrollBehavior = "auto";
    };

    const handlePointerMove = (e: PointerEvent) => {
      if (!isDown) return;

      // Skip wishlist interactions even during move
      if (hasMoved.current) {
        // Once dragging, always prevent default to avoid text selection
        e.preventDefault();
      }

      const x = e.pageX;
      const walk = Math.abs(x - startX);

      if (walk > 8) {
        if (!hasMoved.current) {
          hasMoved.current = true;
          slider.classList.add("is-dragging");
          // Capture pointer once drag is confirmed for reliable tracking
          slider.setPointerCapture(e.pointerId);
        }

        e.preventDefault();

        let actualWalk = x - startX;
        const newScrollLeft = scrollLeft - actualWalk;
        const maxScroll = slider.scrollWidth - slider.clientWidth;

        // Apply rubber-band resistance at edges
        if (newScrollLeft < 0) {
          const overscroll = Math.abs(newScrollLeft);
          const resistance = Math.max(0.15, 1 - overscroll / 300);
          actualWalk = actualWalk * resistance;
        } else if (newScrollLeft > maxScroll) {
          const overscroll = newScrollLeft - maxScroll;
          const resistance = Math.max(0.15, 1 - overscroll / 300);
          actualWalk = actualWalk * resistance;
        }

        // Use rAF for smoother updates
        pendingScrollLeft = scrollLeft - actualWalk;
        if (animationFrameId === null) {
          animationFrameId = requestAnimationFrame(() => {
            if (pendingScrollLeft !== null) {
              slider.scrollLeft = pendingScrollLeft;
            }
            animationFrameId = null;
          });
        }

        // Track velocity with high-precision timing
        const now = performance.now();
        const dt = now - lastTime;
        if (dt > 0 && dt < 100) { // Ignore stale samples
          const currentVelocity = (e.pageX - lastX) / dt;
          velocities.push(currentVelocity);
          if (velocities.length > 5) velocities.shift();
        }
        lastX = e.pageX;
        lastTime = now;
      }
    };

    const handlePointerUp = (e: PointerEvent) => {
      if (!isDown) return;

      // Release pointer capture
      try {
        slider.releasePointerCapture(e.pointerId);
      } catch (_) { /* ignore if not captured */ }

      // Cancel pending animation frame
      if (animationFrameId !== null) {
        cancelAnimationFrame(animationFrameId);
        animationFrameId = null;
      }

      const wasDragging = hasMoved.current;
      isDown = false;
      slider.classList.remove("is-dragging");

      if (!wasDragging) {
        hasMoved.current = false;
        return;
      }

      // Apply final pending scroll position
      if (pendingScrollLeft !== null) {
        slider.scrollLeft = pendingScrollLeft;
        pendingScrollLeft = null;
      }

      const currentScroll = slider.scrollLeft;
      const maxScroll = slider.scrollWidth - slider.clientWidth;

      // Snap back if overscrolled
      if (currentScroll < 0 || currentScroll > maxScroll) {
        slider.style.scrollBehavior = "smooth";
        const targetScroll = currentScroll < 0 ? 0 : maxScroll;
        slider.scrollTo({
          left: targetScroll,
          behavior: "smooth",
        });

        setTimeout(() => {
          hasMoved.current = false;
          slider.style.scrollBehavior = "auto";
        }, 300);
        return;
      }

      // Calculate velocity from recent samples (excluding last 1-2 which may be stale)
      const samplesToUse = velocities.length > 2 ? velocities.slice(-3, -1) : velocities;
      const avgVelocity =
        samplesToUse.length > 0
          ? samplesToUse.reduce((sum, v) => sum + v, 0) / samplesToUse.length
          : 0;

      // Apply momentum if moving fast enough
      if (Math.abs(avgVelocity) > 0.25) {
        slider.style.scrollBehavior = "smooth";
        const momentum = avgVelocity * 180;
        slider.scrollBy({
          left: -momentum,
          behavior: "smooth",
        });

        setTimeout(() => {
          hasMoved.current = false;
          slider.style.scrollBehavior = "auto";
        }, 350);
      } else {
        slider.style.scrollBehavior = "auto";
        hasMoved.current = false;
      }
    };

    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (
        target.closest(".sw-card__wishlist") ||
        target.closest(".swym-button")
      ) {
        return;
      }

      if (hasMoved.current) {
        e.preventDefault();
        e.stopPropagation();
      }
    };

    slider.addEventListener("pointerdown", handlePointerDown);
    slider.addEventListener("pointermove", handlePointerMove);
    slider.addEventListener("pointerup", handlePointerUp);
    slider.addEventListener("pointercancel", handlePointerUp);
    // Use capture phase to intercept clicks before they reach anchor tags
    slider.addEventListener("click", handleClick, true);

    return () => {
      window.removeEventListener("resize", updateGutter);

      // Cancel any pending animation frame on cleanup
      if (animationFrameId !== null) {
        cancelAnimationFrame(animationFrameId);
      }

      images.forEach((img) => {
        img.removeEventListener("dragstart", preventDragStart);
      });

      links.forEach((link) => {
        link.removeEventListener("dragstart", preventDragStart);
      });

      slider.removeEventListener("pointerdown", handlePointerDown);
      slider.removeEventListener("pointermove", handlePointerMove);
      slider.removeEventListener("pointerup", handlePointerUp);
      slider.removeEventListener("pointercancel", handlePointerUp);
      slider.removeEventListener("click", handleClick, true);
    };
  }, [isCarousel]);

  debug.log("Grid settings:", settings);

  return (
    <div className="sw-grid-container">
      <div
        id={gridIdRef.current}
        ref={scrollRef}
        className={`sw-grid ${isCarousel ? "sw-carousel" : "is-grid"}`}
        data-responsive="true"
        style={{
          "--reco-cols": cols,
          "--gap-grid-x": `${gapX}px`,
          "--gap-grid-y": `${gapY}px`,
          "--grid-padding-top": `${padTop}px`,
          "--grid-padding-bottom": `${padBottom}px`,
          "--grid-padding-top-mobile": `${settings.padTopMobile || 16}px`,
          "--grid-padding-bottom-mobile": `${settings.padBottomMobile || 16}px`,
          "--grid-text-alignment": textAlign,
          "--carousel-gap": `${settings.mobileGap || 12}px`,
          "--mobile-cols": settings.mobileColumns || 1,
        } as any}
      >
        {items.map((p: any) => (
          <div
            key={p.id}
            className="sw-grid__item"
            onClick={(e) => {
              if (isLoading || p.skeleton) return;
              const target = e.target as HTMLElement;
              if (
                target.closest(".sw-card__wishlist") ||
                target.closest(".swym-button")
              ) {
                return;
              }
              onClick?.(p);
            }}
          >
            <Card
              product={p}
              moneyFormat={settings.moneyFormat}
              showVendor={settings.showVendor}
              showPrice={settings.showPrice}
              showComparePrice={settings.showComparePrice}
              showSaleBadge={settings.showSaleBadge}
              showWishlist={settings.showWishlist}
              showReviews={settings.showReviews}
              showQuickBuy={settings.showQuickBuy !== false}
              imageRatio={settings.imageRatio}
              borderStyle={settings.cardBorderStyle}
              cardRadius={settings.cardRadius}
              integrations={settings.integrations}
              onQuickBuy={onQuickBuy}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
