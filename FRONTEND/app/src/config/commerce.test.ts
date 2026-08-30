import { describe, expect, it } from "vitest";
import {
  FULFILLMENT_OPTIONS,
  PAYMENT_METHODS,
  SUPPORTED_CURRENCIES,
  WEIGHT_UNITS,
} from "./commerce";

describe("commerce foundation configuration", () => {
  it("keeps currencies unique", () => {
    const codes = SUPPORTED_CURRENCIES.map(({ code }) => code);
    expect(new Set(codes).size).toBe(codes.length);
  });

  it("supports grams and kilograms", () => {
    expect(WEIGHT_UNITS.map(({ value }) => value)).toEqual(["G", "KG"]);
  });

  it("exposes the approved fulfillment and payment labels", () => {
    expect(FULFILLMENT_OPTIONS.map(({ label }) => label)).toEqual([
      "Pickup",
      "Delivery",
    ]);
    expect(PAYMENT_METHODS.map(({ label }) => label)).toEqual([
      "Recharge from store",
      "Recharge online",
    ]);
  });
});
