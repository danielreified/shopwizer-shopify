/** @jsxImportSource preact */
import { h, render } from "preact";
import { useEffect, useState } from "preact/hooks";

function debug(...args) {
  console.log("%c[SW:HOME]", "color:#FF8800;font-weight:bold;", ...args);
}

function App({ el }) {
  return (
    <div class="sw-home-wrapper">
      <div
        class="sw-grid"
      >
        <p>dasjkhdsajkdasjdasjkdaskdksjal</p>
        <p>dasjkhdsajkdasjdasjkdaskdksjal</p>
        <p>dasjkhdsajkdasjdasjkdaskdksjal</p>
        <p>dasjkhdsajkdasjdasjkdaskdksjal</p>
        <p>dasjkhdsajkdasjdasjkdaskdksjal</p>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// MOUNT
// --------------------------------------------------------------------------- 
(function () {
  const MOUNT_SELECTOR = '[id^="shopwise-home-"]';

  function mount(root = document) {
    debug("Mount triggered");

    root.querySelectorAll(MOUNT_SELECTOR).forEach((el) => {
      if (el.dataset.mounted === "true") return;
      el.dataset.mounted = "true";

      debug("Mounting widget", { el });
      render(<App el={el} />, el);
    });
  }

  // Initial load
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => mount());
  } else {
    mount();
  }

  // Theme editor: sections
  document.addEventListener("shopify:section:load", (e) => {
    mount(e.target);
  });

  // Theme editor: blocks (THIS is what fixes homepage)
  document.addEventListener("shopify:block:load", (e) => {
    mount(e.target);
  });
})();
