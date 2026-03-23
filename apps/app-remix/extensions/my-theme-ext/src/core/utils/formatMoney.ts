// src/core/utils/money.ts

/**
 * Round currency for "no decimals" formats
 */
function roundCurrency(value: number): number {
  const fractionalPart = value - Math.floor(value);
  return fractionalPart >= 0.5 ? Math.ceil(value) : Math.floor(value);
}

/**
 * Format money value using Shopify's money format template
 * @param cents - Value in cents (e.g., 1500 = $15.00)
 * @param template - Shopify money format (e.g., "${{amount}}")
 */
export function formatMoney(cents: number, template: string): string {
  // Convert cents to dollars
  const value = cents / 100;
  const rounded = roundCurrency(value);

  const formats: Record<string, string> = {
    // 1134.65 -> "1,134.65"
    "{{amount}}": value.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ","),

    // 1134.65 -> "1,135" (rounded)
    "{{amount_no_decimals}}": rounded
      .toString()
      .replace(/\B(?=(\d{3})+(?!\d))/g, ","),

    // 1134.65 -> "1.134,65"
    "{{amount_with_comma_separator}}": value
      .toFixed(2)
      .replace(".", ",")
      .replace(/\B(?=(\d{3})+(?!\d))/g, "."),

    // 1134.65 -> "1.135" (rounded)
    "{{amount_no_decimals_with_comma_separator}}": rounded
      .toString()
      .replace(/\B(?=(\d{3})+(?!\d))/g, "."),

    // 1134.65 -> "1'134.65"
    "{{amount_with_apostrophe_separator}}": value
      .toFixed(2)
      .replace(/\B(?=(\d{3})+(?!\d))/g, "'"),

    // 1134.65 -> "1 135" (rounded)
    "{{amount_no_decimals_with_space_separator}}": rounded
      .toString()
      .replace(/\B(?=(\d{3})+(?!\d))/g, " "),

    // 1134.65 -> "1 134,65"
    "{{amount_with_space_separator}}": value
      .toFixed(2)
      .replace(".", ",")
      .replace(/\B(?=(\d{3})+(?!\d))/g, " "),

    // 1134.65 -> "1 134.65"
    "{{amount_with_period_and_space_separator}}": value
      .toFixed(2)
      .replace(/\B(?=(\d{3})+(?!\d))/g, " "),
  };

  let result = template;

  Object.keys(formats).forEach((placeholder) => {
    if (result.includes(placeholder)) {
      result = result.replace(placeholder, formats[placeholder]);
    }
  });

  return result;
}
