// src/core/attribution/cache.tsx

const KEY = "__shopwizer_attrib__v1";
const TTL = 30 * 24 * 60 * 60 * 1000; // 30 days
const MAX = 50;

export function getAttributions() {
  try {
    const now = Date.now();
    const list = JSON.parse(localStorage.getItem(KEY) || "[]")
      .filter((r: any) => now - r.ts < TTL)
      .slice(-MAX);

    localStorage.setItem(KEY, JSON.stringify(list));
    return list;
  } catch {
    return [];
  }
}

export function recordAttribution(pid: string, type: string) {
  const list = getAttributions();
  const now = Date.now();

  const found = list.find((r: any) => r.pid === pid);
  if (found) found.ts = now;
  else list.push({ pid, type, ts: now });

  localStorage.setItem(KEY, JSON.stringify(list.slice(-MAX)));
}
