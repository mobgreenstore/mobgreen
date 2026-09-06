import type { SupportedCurrency } from "@/config/commerce";

export const STOREFRONT_CURRENCY_COOKIE = "mob-greens-currency";
export const DEFAULT_STOREFRONT_CURRENCY: SupportedCurrency = "USD";

const EURO_COUNTRIES = new Set([
  "AT",
  "BE",
  "HR",
  "CY",
  "EE",
  "FI",
  "FR",
  "DE",
  "GR",
  "IE",
  "IT",
  "LV",
  "LT",
  "LU",
  "MT",
  "NL",
  "PT",
  "SK",
  "SI",
  "ES",
]);

export function isSupportedCurrency(
  value: string | null | undefined,
): value is SupportedCurrency {
  return value === "GBP" || value === "EUR" || value === "USD";
}

export function currencyForCountry(
  countryCode: string | null | undefined,
): SupportedCurrency {
  const country = countryCode?.trim().toUpperCase();
  if (country === "GB") return "GBP";
  if (country && EURO_COUNTRIES.has(country)) return "EUR";
  return "USD";
}
