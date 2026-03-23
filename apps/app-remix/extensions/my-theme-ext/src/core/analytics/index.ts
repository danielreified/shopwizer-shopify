// src/core/analytics/index.ts

import { createDebugger } from "../utils/debug";

const debug = createDebugger("[ANALYTICS]: ", true);

// -------------------------------------------------------------
// Shopify Analytics helpers
// -------------------------------------------------------------

/**
 * Fire a click event when a recommended product is clicked
 */
export function publishClicked({
  productId,
  variantId,
  rail,
  placement,
  srcPid,
  slateId,
  p,
  ps,
  action,
  quantity,
}: {
  productId: string | number;
  variantId?: string | number;
  rail: string;
  placement?: string;
  srcPid?: string | number;
  slateId?: string;
  p?: string;
  ps?: string;
  action?: 'click' | 'quick_buy_open' | 'quick_buy_add';
  quantity?: number;
}) {
  try {
    (window as any).Shopify?.analytics?.publish?.("recommendation_clicked", {
      productId,
      variantId,
      rail,
      placement,
      srcPid,
      slate_id: slateId,
      p,
      ps,
      action: action || 'click',
      quantity: quantity || 1,
    });
  } catch (err) {
    debug.warn("[Shopwizer] Failed to publish clicked event", err);
  }
}

/**
 * Fire a viewed event when recommendations enter the viewport
 */
export function publishViewed({
  rail,
  placement,
  slateId,
}: {
  rail: string;
  placement?: string;
  slateId?: string;
}) {
  try {
    (window as any).Shopify?.analytics?.publish?.("recommendation_viewed", {
      rail,
      placement,
      slate_id: slateId,
    });
  } catch (err) {
    debug.warn("[Shopwizer] Failed to publish viewed event", err);
  }
}

