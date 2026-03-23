// src/session/index.ts

import { getOrCreateSessionId } from "./id";

export function initSession() {
  const sid = getOrCreateSessionId();
  (window as any).__shopwise_sid__ = sid;

  window.dispatchEvent(
    new CustomEvent("shopwise:session", {
      detail: { sid },
    })
  );

  return sid;
}
