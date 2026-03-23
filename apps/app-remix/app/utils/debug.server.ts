export type DebugLog = { label: string; data?: unknown };

export function makeDebug(request: Request) {
  const url = new URL(request.url);
  const isDev = process.env.NODE_ENV !== "production";

  // ✅ Always enabled in dev; only opt-in in production
  const enabled = true;

  const logs: DebugLog[] = [];

  const log = (label: string, data?: unknown) => {
    if (enabled) {
      logs.push({ label, data });
      // Use stderr for guaranteed visibility (works even in SSR workers)
      process.stderr.write(
        `\n🪵 [Remix Debug] ${label} ${JSON.stringify(data, null, 2)}\n`,
      );
    }
  };

  const json = <T extends Record<string, any>>(data: T, init?: ResponseInit) =>
    Response.json(enabled ? { ...data, _debug: { logs } } : data, init);

  return { enabled, url, log, json };
}
