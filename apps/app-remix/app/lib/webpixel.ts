// app/lib/webpixel.ts
import {
  WEBPIXEL_Q,
  WEBPIXEL_CREATE,
  WEBPIXEL_UPDATE,
} from "../gql/webpixel.server";

type AdminLike = { graphql: (q: string, opts?: any) => Promise<Response> };

const DEBUG = process.env.DEBUG_WEBPIXEL === "1";
const hdr = (r: Response, k: string) => r.headers.get(k) ?? "";

export async function ensureWebPixel(
  admin: AdminLike,
  settings: Record<string, unknown> = {}
): Promise<string | null> {
  // 1) Try to read the existing pixel (SDK may throw if none exists)
  let existing: { id: string; settings: unknown } | null = null;
  try {
    const r = await admin.graphql(WEBPIXEL_Q);
    const reqId = hdr(r, "x-request-id");
    const j = (await r.json()) as any;
    if (DEBUG) {
      console.log("[webpixel] query status", r.status, "req", reqId);
      console.log("[webpixel] query body", JSON.stringify(j));
    }
    existing = j?.data?.webPixel ?? null;
  } catch (e: any) {
    // Shopify’s client can throw with message “No web pixel was found for this app.”
    if (DEBUG) console.warn("[webpixel] query threw:", e?.message || e);
    const msg = String(e?.message || "");
    if (!/no web pixel was found/i.test(msg)) throw e;
  }

  // 2) Create if missing
  if (!existing) {
    const r = await admin.graphql(WEBPIXEL_CREATE, {
      variables: { webPixel: { settings } },
    });
    const reqId = hdr(r, "x-request-id");
    const j = (await r.json()) as any;
    if (DEBUG) {
      console.log("[webpixel] create status", r.status, "req", reqId);
      console.log("[webpixel] create body", JSON.stringify(j));
    }

    const errs = j?.data?.webPixelCreate?.userErrors ?? [];
    if (errs.length) {
      const msg = errs.map((e: any) => e.message).join("; ");
      // If Shopify replies “already exists”, just fall back to reading it
      if (/already/i.test(msg)) {
        if (DEBUG) console.warn("[webpixel] create says already exists; re-querying");
        return ensureWebPixel(admin, settings); // re-run; it will hit the read path
      }
      throw new Error(`webPixelCreate: ${msg} (req ${reqId})`);
    }
    return j?.data?.webPixelCreate?.webPixel?.id ?? null;
  }

  // 3) Update if settings differ
  const same =
    JSON.stringify(existing.settings ?? {}) === JSON.stringify(settings ?? {});
  if (same) return existing.id;

  const r = await admin.graphql(WEBPIXEL_UPDATE, {
    variables: { id: existing.id, webPixel: { settings } },
  });
  const reqId = hdr(r, "x-request-id");
  const j = (await r.json()) as any;
  if (DEBUG) {
    console.log("[webpixel] update status", r.status, "req", reqId);
    console.log("[webpixel] update body", JSON.stringify(j));
  }

  const errs = j?.data?.webPixelUpdate?.userErrors ?? [];
  if (errs.length) {
    throw new Error(
      `webPixelUpdate: ${errs.map((e: any) => e.message).join("; ")} (req ${reqId})`
    );
  }
  return j?.data?.webPixelUpdate?.webPixel?.id ?? existing.id;
}
