// src/session/id.ts

const SID_KEY = "__shopwizer_sid__";
const SID_TTL = 30 * 60 * 1000; // 30 minutes

export function getOrCreateSessionId() {
  try {
    const now = Date.now();
    const raw = localStorage.getItem(SID_KEY);

    let sid, ts;

    if (raw) {
      const data = JSON.parse(raw);
      sid = data.sid;
      ts = data.ts;
    }

    if (!sid || now - ts > SID_TTL) {
      sid = crypto.randomUUID();
      ts = now;
    }

    localStorage.setItem(SID_KEY, JSON.stringify({ sid, ts: now }));
    return sid;
  } catch {
    return crypto.randomUUID();
  }
}
