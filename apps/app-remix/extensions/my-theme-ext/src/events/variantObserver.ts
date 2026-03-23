// src/utils/variantObserver.ts

/* --------------------------------------------------------------
   GLOBAL VARIANT OBSERVER (Shopwizer) – TypeScript Version
-------------------------------------------------------------- */

// Extend window types safely
declare global {
  interface Window {
    __shopwiseVariantObserver__?: boolean;
    __shopwise_current_variant?: string | null;
  }
}

(function () {
  if (typeof window === "undefined") return;
  if (window.__shopwiseVariantObserver__) return;

  window.__shopwiseVariantObserver__ = true;

  /* --------------------------------------------------------------
     DISPATCH HELPER
  -------------------------------------------------------------- */
  const dispatch = (variantId: string | number | null | undefined): void => {
    if (!variantId) return;

    const idStr = String(variantId);
    if (idStr === window.__shopwise_current_variant) return;

    window.__shopwise_current_variant = idStr;

    document.dispatchEvent(
      new CustomEvent("shopwise:variant", {
        detail: { variantId: idStr },
      })
    );

    console.debug("[ShopwiseReco] 🔄 Variant changed:", idStr);
  };

  /* --------------------------------------------------------------
     1) Online Store 2.0 variant events
  -------------------------------------------------------------- */
  const osEvents: string[] = ["variant:change", "variant:changed"];

  osEvents.forEach((evt) => {
    document.addEventListener(evt, (e: Event) => {
      // Try to extract variant id from multiple Shopify patterns
      // @ts-ignore - Shopify uses untyped .detail structures
      const detail = (e as CustomEvent)?.detail;

      const v =
        detail?.variant?.id ??
        detail?.id ??
        detail?.variant_id ??
        detail ??
        null;

      dispatch(v);
    });
  });

  /* --------------------------------------------------------------
     2) Classic themes: hidden input(name="id") listener
  -------------------------------------------------------------- */
  let inputEl: HTMLInputElement | null = null;

  const bindInput = (): void => {
    const next =
      (document.querySelector(
        'form[action^="/cart/add"] input[name="id"]'
      ) as HTMLInputElement | null) ||
      (document.querySelector('input[name="id"]') as HTMLInputElement | null);

    if (!next || next === inputEl) return;

    if (inputEl) inputEl.removeEventListener("change", onChange);

    inputEl = next;

    function onChange() {
      if (inputEl) dispatch(inputEl.value);
    }

    inputEl.addEventListener("change", onChange);
  };

  bindInput();

  new MutationObserver(() => bindInput()).observe(document.body, {
    subtree: true,
    childList: true,
  });

  /* --------------------------------------------------------------
     3) Polling fallback (for hidden value changes)
  -------------------------------------------------------------- */
  let last: string | null = null;

  (function poll() {
    const current =
      (inputEl as HTMLInputElement | null)?.value ||
      (document.querySelector('input[name="id"]') as HTMLInputElement | null)
        ?.value ||
      null;

    if (current && current !== last) {
      last = current;
      dispatch(current);
    }

    setTimeout(poll, 200);
  })();

  console.debug("[ShopwiseReco] Variant observer ready (TS)");
})();

export { };
