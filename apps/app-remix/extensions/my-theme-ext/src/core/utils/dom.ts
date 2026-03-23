// src/utils/dom.ts

import { createDebugger } from "./debug";

const debug = createDebugger("DOM");

/* --------------------------------------------------------------
   DOM UTILITIES
-------------------------------------------------------------- */

/**
 * Extract all data-* attributes from the element and camelCase them.
 * Example:
 *   data-products-to-show="8" → { productsToShow: "8" }
 */
export function extractSettings(el: HTMLElement): Record<string, any> {
  const out: Record<string, any> = {};

  for (const [key, raw] of Object.entries(el.dataset)) {
    let value: any = raw;

    // Convert "true" / "false" to booleans
    if (raw === "true") value = true;
    else if (raw === "false") value = false;
    // Convert strings that look like numbers to numbers
    else if (raw !== "" && !isNaN(raw as any)) value = Number(raw);
    // Keep empty strings as empty strings
    // DO NOT convert them to true (this was the bug!)
    else value = raw;

    out[key] = value;
  }

  debug.log("Extracted settings:", out);
  return out;
}

/**
 * Remove all children from the node.
 */
export function clear(el: HTMLElement) {
  while (el.firstChild) {
    el.removeChild(el.firstChild);
  }
}

/**
 * Create an HTML element with props + children.
 */
export function el<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  props: Record<string, any> = {},
  ...children: (HTMLElement | string)[]
): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag);
  Object.assign(node, props);

  for (const child of children) {
    if (typeof child === "string")
      node.appendChild(document.createTextNode(child));
    else if (child) node.appendChild(child);
  }

  return node;
}
