/**
 * Strip HTML tags and collapse whitespace.
 */
export function stripHtml(html: string): string {
  return html
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Strip ```json / ``` fences from LLM responses.
 */
export function cleanLlmJson(raw: string): string {
  return raw
    .replace(/```json/gi, '')
    .replace(/```/g, '')
    .trim();
}

/**
 * Filter out tags that are pure numbers, codes, sizes, or season/business codes.
 */
export function filterUsefulTags(tags: string[], limit = 15): string[] {
  return tags
    .filter((tag) => {
      const t = tag.toLowerCase();
      if (/^\d+$/.test(t)) return false;
      if (/^[a-z]\d+/.test(t)) return false;
      if (/^(xs|s|m|l|xl|xxl|xxxl)$/i.test(t)) return false;
      if (/^w\d{2}/.test(t)) return false;
      if (/^(bf|q1|q2|q3|q4)/i.test(t)) return false;
      return true;
    })
    .slice(0, limit);
}
