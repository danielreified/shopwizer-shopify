// Simple, fast, scoped logger with levels + timings
// Usage: const log = makeDebug("router"); log.step("start", ctx) / log.ok(...)
const LEVEL = (process.env.DEBUG_LEVEL || 'info').toLowerCase(); // "info" | "debug" | "trace"
const ENABLED = (process.env.DEBUG_ENRICH || '1') !== '0';

type Any = Record<string, any>;
type Timer = { label: string; t0: bigint };

function should(level: 'info' | 'debug' | 'trace') {
  if (!ENABLED) return false;
  const order = { info: 0, debug: 1, trace: 2 } as const;
  return order[level] <= order[LEVEL as keyof typeof order];
}

function fmt(obj: Any) {
  try {
    return JSON.stringify(obj, null, 2);
  } catch {
    return String(obj);
  }
}

export function makeDebug(scope: string) {
  const prefix = `[enrich:${scope}]`;
  return {
    info: (msg: string, ctx?: Any) => {
      if (should('info')) console.log(prefix, msg, ctx ?? '');
    },
    debug: (msg: string, ctx?: Any) => {
      if (should('debug')) console.log(prefix, msg, ctx ?? '');
    },
    trace: (msg: string, ctx?: Any) => {
      if (should('trace')) console.log(prefix, msg, ctx ?? '');
    },
    warn: (msg: string, ctx?: Any) => console.warn(prefix, '⚠️', msg, ctx ?? ''),
    error: (msg: string, err?: unknown, ctx?: Any) =>
      console.error(prefix, '❌', msg, err, ctx ?? ''),

    // timing helpers
    tstart(label: string): Timer {
      return { label, t0: process.hrtime.bigint() };
    },
    tend(t: Timer, extra?: Any) {
      const ms = Number((process.hrtime.bigint() - t.t0) / 1000000n);
      if (should('debug')) console.log(prefix, `⏱ ${t.label}: ${ms}ms`, extra ?? '');
      return ms;
    },

    // safe object print
    dump(title: string, obj: Any) {
      if (!should('trace')) return;
    },
  };
}
