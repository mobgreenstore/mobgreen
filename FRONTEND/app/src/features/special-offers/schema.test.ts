import { describe, expect, it } from "vitest";
import { categoryOfferPolicySchema } from "@/features/special-offers/schema";

const validPolicy = {
  enabled: true,
  minimumWeightGrams: 80,
  maximumWeightGrams: 1_000,
  minimumDiscountBps: 300,
  maximumDiscountBps: 1_500,
  minimumMarginBps: 1_500,
  durationMinutes: 1_440,
  maxOffersPerPriceOption: 4,
};

describe("special offer policy", () => {
  it("accepts the approved safe contract", () => {
    expect(categoryOfferPolicySchema.parse(validPolicy)).toEqual(validPolicy);
  });

  it("rejects weights below 80 grams", () => {
    expect(
      categoryOfferPolicySchema.safeParse({
        ...validPolicy,
        minimumWeightGrams: 79,
      }).success,
    ).toBe(false);
  });

  it("rejects discounts above 15 percent", () => {
    expect(
      categoryOfferPolicySchema.safeParse({
        ...validPolicy,
        maximumDiscountBps: 1_501,
      }).success,
    ).toBe(false);
  });

  it("rejects durations above 24 hours", () => {
    expect(
      categoryOfferPolicySchema.safeParse({
        ...validPolicy,
        durationMinutes: 1_441,
      }).success,
    ).toBe(false);
  });

  it("requires ordered weight and discount ranges", () => {
    expect(
      categoryOfferPolicySchema.safeParse({
        ...validPolicy,
        maximumWeightGrams: 80,
      }).success,
    ).toBe(false);
    expect(
      categoryOfferPolicySchema.safeParse({
        ...validPolicy,
        minimumDiscountBps: 1_000,
        maximumDiscountBps: 900,
      }).success,
    ).toBe(false);
  });
});
