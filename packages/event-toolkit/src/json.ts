export function parseJsonSafe<T = unknown>(s: string | undefined): T | null {
  if (!s) return null;
  try {
    return JSON.parse(s) as T;
  } catch {
    return null;
  }
}

/**
 * Unwrap EventBridge envelope format.
 * EventBridge messages come as: { source, detail-type, detail: { actual payload } }
 * This extracts the 'detail' payload, or returns the original if not EventBridge format.
 */
export function unwrapEventBridge<T = unknown>(raw: unknown): T {
  const obj = raw as Record<string, unknown> | null;
  if (obj && typeof obj === 'object' && 'detail' in obj && 'detail-type' in obj) {
    return obj.detail as T;
  }
  return raw as T;
}

/**
 * Parse JSON and unwrap EventBridge envelope in one step.
 * Convenience function that combines parseJsonSafe + unwrapEventBridge.
 */
export function parseAndUnwrap<T = unknown>(s: string | undefined): T | null {
  const parsed = parseJsonSafe(s);
  if (!parsed) return null;
  return unwrapEventBridge<T>(parsed);
}
