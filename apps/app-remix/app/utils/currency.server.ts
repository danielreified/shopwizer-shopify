let ratesCache: Record<string, number> | null = null;

export async function loadCurrencyRates(): Promise<Record<string, number>> {
  if (ratesCache) return ratesCache;

  try {
    const res = await fetch("https://currency.shopwizer.co.za/latest.json");
    const json = await res.json();

    if (json.rates && typeof json.rates === "object") {
      ratesCache = json.rates as Record<string, number>;
      return ratesCache;
    }
  } catch (err) {
    console.error("[currency] Failed to load currency rates", err);
  }

  return {};
}

export async function normalizeToUSD(
  amount: number,
  currency: string,
): Promise<number> {
  if (!amount || !currency) return amount;

  const rates = await loadCurrencyRates();
  const rate = rates[currency.toUpperCase()];

  if (!rate || !Number.isFinite(rate)) return amount;

  return amount / rate;
}
