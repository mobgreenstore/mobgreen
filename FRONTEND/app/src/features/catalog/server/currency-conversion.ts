import "server-only";

import type { SupportedCurrency } from "@/config/commerce";

type Rates = Record<SupportedCurrency, number>;

const FALLBACK_EUR_RATES: Rates = {
  EUR: 1,
  GBP: 0.85898,
  USD: 1.1622,
};

const ECB_RATES_URL =
  "https://data-api.ecb.europa.eu/service/data/EXR/D.USD+GBP.EUR.SP00.A?lastNObservations=1&format=csvdata&detail=dataonly";

function parseEcbRates(csv: string): Rates | null {
  const rates: Rates = { ...FALLBACK_EUR_RATES };
  for (const line of csv.trim().split(/\r?\n/).slice(1)) {
    const columns = line.split(",");
    const currency = columns[2];
    const value = Number(columns[7]);
    if ((currency === "GBP" || currency === "USD") && value > 0) {
      rates[currency] = value;
    }
  }
  return rates.GBP > 0 && rates.USD > 0 ? rates : null;
}

async function euroRates(): Promise<Rates> {
  if (process.env.NODE_ENV === "test") return FALLBACK_EUR_RATES;
  try {
    const response = await fetch(ECB_RATES_URL, {
      headers: { accept: "text/csv" },
      next: { revalidate: 21_600 },
    });
    if (!response.ok) return FALLBACK_EUR_RATES;
    return parseEcbRates(await response.text()) ?? FALLBACK_EUR_RATES;
  } catch {
    return FALLBACK_EUR_RATES;
  }
}

export async function convertMinorUnits(
  amountMinor: number,
  from: SupportedCurrency,
  to: SupportedCurrency,
) {
  if (from === to) return amountMinor;
  const rates = await euroRates();
  return Math.round((amountMinor / rates[from]) * rates[to]);
}

export async function convertPrice<
  T extends { currency: SupportedCurrency; priceMinor: number },
>(price: T, targetCurrency: SupportedCurrency): Promise<T> {
  return {
    ...price,
    currency: targetCurrency,
    priceMinor: await convertMinorUnits(
      price.priceMinor,
      price.currency,
      targetCurrency,
    ),
  };
}
