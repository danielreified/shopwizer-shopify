import { logger } from '@repo/logger';

let ratesCache: Record<string, number> | null = null;

export async function loadCurrencyRates(): Promise<Record<string, number>> {
  if (ratesCache) return ratesCache;

  try {
    const res = await fetch('https://currency.shopwizer.co.za/latest.json');
    const json = await res.json();
    if (json.rates && typeof json.rates === 'object') {
      ratesCache = json.rates as Record<string, number>;
      return ratesCache;
    }
  } catch (err) {
    logger.error({ err }, 'Failed to load currency rates');
  }

  return {};
}

/**
 * Convert a price from the given currency to USD using pre-loaded rates.
 * Returns the original price if conversion isn't possible.
 */
export function convertToUsd(
  price: number,
  currency: string | undefined,
  rates: Record<string, number> | null,
): number {
  if (!currency || !rates) return price;
  const rate = rates[currency.toUpperCase()];
  if (!rate || !Number.isFinite(rate)) return price;
  return price / rate;
}

export async function normalizeToUSD(amount: number, currency: string): Promise<number> {
  if (!amount || !currency) return amount;

  const rates = await loadCurrencyRates();
  return convertToUsd(amount, currency, rates);
}
