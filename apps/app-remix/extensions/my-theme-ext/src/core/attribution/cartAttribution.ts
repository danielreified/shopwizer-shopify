// src/core/attribution/cartAttribution.ts

import { createDebugger } from "../utils/debug";

const debug = createDebugger("Attribution");

export function initCartAttribution() {
  debug.log("🚀 initCartAttribution() called");

  if (typeof window === "undefined") {
    debug.log("❌ window is undefined, aborting");
    return;
  }

  if ((window as any).__sw_cart_listener__) {
    debug.log("⏭️ Cart listener already initialized, skipping");
    return;
  }

  (window as any).__sw_cart_listener__ = true;
  debug.log("✅ Cart attribution listener REGISTERED");

  const ATTR_KEY = "__shopwizer_attrib__v1";

  // Listen for cart mutations (before add)
  window.addEventListener("SW:mutate", async () => {
    debug.log("📦 SW:mutate event received - capturing cart state BEFORE add");
    try {
      const cart = await fetch("/cart.js").then((r) => r.json());
      (window as any).__sw_cart_before__ = cart.items || [];
      debug.log("   Cart items before:", (window as any).__sw_cart_before__.length);
    } catch (err) {
      debug.error("   ❌ Failed to fetch cart:", err);
      (window as any).__sw_cart_before__ = [];
    }
  });

  async function patchCart(payload: any) {
    debug.log("🔧 patchCart called with:", payload);
    for (let i = 0; i < 3; i++) {
      try {
        await fetch("/cart/change.js", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        debug.log("   ✅ Cart patched successfully, attempt:", i + 1);
        return true;
      } catch (err) {
        debug.error("   ❌ Cart patch failed, attempt:", i + 1, err);
        await new Promise((res) => setTimeout(res, 150 * (i + 1)));
      }
    }
    debug.error("   ❌ All patch attempts failed");
    return false;
  }

  // Listen for cart add events
  window.addEventListener("SW:add", async () => {
    debug.log("🛒 SW:add event received - checking for new items to attribute");

    const before = (window as any).__sw_cart_before__ || [];
    debug.log("   Cart state BEFORE had:", before.length, "items");

    let cart;
    try {
      cart = await fetch("/cart.js").then((r) => r.json());
      debug.log("   Cart state AFTER has:", cart.items?.length || 0, "items");
    } catch (err) {
      debug.error("   ❌ Failed to fetch cart after add:", err);
      return;
    }

    const after = cart.items || [];
    const newItems = after.filter((a: any) => !before.some((b: any) => b.key === a.key));
    debug.log("   🆕 New items to process:", newItems.length);

    if (!newItems.length) {
      debug.log("   ⏭️ No new items found, nothing to attribute");
      return;
    }

    // Get stored attributions
    const attributions = JSON.parse(localStorage.getItem(ATTR_KEY) || "[]");
    debug.log("   📋 Stored attributions from localStorage:", attributions);

    for (const item of newItems) {
      debug.log("   ─────────────────────────────────");
      debug.log("   🔍 Processing item:", item.title);
      debug.log("      Product ID:", item.product_id);
      debug.log("      Item key:", item.key);
      debug.log("      Current properties:", item.properties);

      const record = attributions.find((r: any) => String(r.pid) === String(item.product_id));
      debug.log("      Matching attribution record:", record);

      if (!record) {
        debug.log("      ❌ No attribution record for this product, skipping");
        continue;
      }

      if (item.properties?._shopwizer) {
        debug.log("      ⏭️ Already has _shopwizer property, skipping");
        continue;
      }

      const props = {
        ...item.properties,
        _shopwizer: "Recommended by Shopwizer",
      };

      debug.log("      🏷️ PATCHING cart item with:", props);

      const success = await patchCart({
        id: item.key,
        quantity: item.quantity,
        properties: props,
      });

      if (success) {
        debug.log("      ✅ Attribution patched successfully!");
      } else {
        debug.log("      ❌ Failed to patch attribution");
      }
    }

    debug.log("🏁 SW:add processing complete");
  });

  debug.log("👂 Now listening for SW:mutate and SW:add events");
}
