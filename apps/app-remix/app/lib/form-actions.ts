/**
 * Build a FormData object with an intent and optional key-value pairs.
 * Replaces the repeated pattern of creating FormData, appending intent, then fields.
 */
export function buildFormData(
  intent: string,
  data?: Record<string, string>,
): FormData {
  const fd = new FormData();
  fd.append("intent", intent);
  if (data) {
    for (const [k, v] of Object.entries(data)) fd.append(k, v);
  }
  return fd;
}
