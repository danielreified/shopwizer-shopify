/**
 * Trim and return undefined for empty/null strings.
 */
export function clean(s?: string | null): string | undefined {
  if (s == null) return undefined;
  const t = String(s).trim();
  return t.length ? t : undefined;
}
