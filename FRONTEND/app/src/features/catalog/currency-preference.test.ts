import { describe, expect, it } from "vitest";
import {
  currencyForCountry,
  isSupportedCurrency,
} from "@/features/catalog/currency-preference";

describe("storefront currency preference", () => {
  it("maps the United Kingdom and euro countries to their local currency", () => {
    expect(currencyForCountry("GB")).toBe("GBP");
    expect(currencyForCountry("fr")).toBe("EUR");
    expect(currencyForCountry("DE")).toBe("EUR");
  });

  it("uses USD for countries outside the supported local currencies", () => {
    expect(currencyForCountry("CM")).toBe("USD");
    expect(currencyForCountry(undefined)).toBe("USD");
  });

  it("accepts only currencies supported by the store", () => {
    expect(isSupportedCurrency("GBP")).toBe(true);
    expect(isSupportedCurrency("XAF")).toBe(false);
  });
});
