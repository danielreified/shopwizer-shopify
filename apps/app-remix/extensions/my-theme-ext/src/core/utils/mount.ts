// src/utils/mount.ts

import { createDebugger } from "../utils/debug";

const debug = createDebugger("[MOUNT]: ", false);

import { h, render } from "preact";

export function mountByRecommender(
  recommender: string,
  WidgetComponent: (props: { el: HTMLElement }) => any,
) {
  const ROOT_SELECTOR = '[id^="shopwise-reco-"]';

  debug.log(`📌 [MOUNT] Initializing mountByRecommender("${recommender}")`);

  function mount(root: Document | HTMLElement = document) {
    debug.log("📌 [MOUNT] Running mount() on root:", root);

    const nodes = root.querySelectorAll<HTMLElement>(ROOT_SELECTOR);

    debug.log(
      `📌 [MOUNT] Found ${nodes.length} widget nodes for selector ${ROOT_SELECTOR}`,
    ); 

    nodes.forEach((el, index) => {
      debug.log(`📌 [MOUNT] → Node #${index}`, el);

      const r = el.dataset.recommender;
      debug.log(`📌 [MOUNT]   dataset.recommender = "${r}"`);

      if (r !== recommender) {
        debug.log(
          `📌 [MOUNT]   SKIP — recommender mismatch (expected "${recommender}", got "${r}")`,
        );
        return;
      }

      if (el.dataset.mounted === "true") {
        debug.log("📌 [MOUNT]   SKIP — already mounted");
        return;
      }

      debug.log(`📌 [MOUNT]   Mounting widget "${recommender}" on:`, el);

      el.dataset.mounted = "true";

      try {
        debug.log(`📌 [MOUNT]   Rendering Preact component into element...`);
        render(h(WidgetComponent, { el }), el);

        debug.log(
          `📌 [MOUNT]   SUCCESS — WidgetComponent("${recommender}") rendered`,
        );
      } catch (err) {
        debug.warn(
          `📌 [MOUNT]   ❌ ERROR — Failed to mount widget "${recommender}"`,
          err,
        );
      }
    });
  }

  /* -----------------------------------------------------------
    INITIAL MOUNT
  ----------------------------------------------------------- */
  if (document.readyState === "loading") {
    debug.log(`📌 [MOUNT] Document loading — waiting for DOMContentLoaded`);

    document.addEventListener("DOMContentLoaded", () => {
      debug.log("📌 [MOUNT] DOMContentLoaded fired");
      mount();
    });
  } else {
    debug.log("📌 [MOUNT] Document ready — running initial mount()");
    mount();
  }

  /* -----------------------------------------------------------
    SHOPIFY THEME EDITOR EVENTS
  ----------------------------------------------------------- */

  document.addEventListener("shopify:section:load", (e: any) => {
    debug.log("📌 [MOUNT] shopify:section:load", e.target);
    mount(e.target);
  });

  document.addEventListener("shopify:block:select", (e: any) => {
    debug.log("📌 [MOUNT] shopify:block:select", e.target);
    mount(e.target);
  });

  document.addEventListener("shopify:section:unload", (e: any) => {
    debug.log("📌 [MOUNT] shopify:section:unload", e.target);
    // No unmounting needed; new DOM will remount automatically.
  });
}
