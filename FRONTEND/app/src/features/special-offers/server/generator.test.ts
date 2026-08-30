import { describe, expect, it } from "vitest";
import {
  generateSpecialOffers,
  weightToMilligrams,
} from "@/features/special-offers/server/generator";

const policy = {
  enabled: true,
  minimumWeightGrams: 80,
  maximumWeightGrams: 1_000,
  minimumDiscountBps: 300,
  maximumDiscountBps: 1_500,
  minimumMarginBps: 1_500,
  durationMinutes: 1_440,
  maxOffersPerPriceOption: 4,
};

const option = {
  productId: "a06af44a-68ca-4aef-95db-321fe6fd9e11",
  priceOptionId: "a70d9361-91cd-4d47-873f-7e5780fa23cc",
  weightValue: "100",
  weightUnit: "G" as const,
  currency: "EUR" as const,
  priceMinor: 10_000n,
  costMinor: 6_000n,
};

function generate(overrides: Partial<typeof policy> = {}) {
  return generateSpecialOffers({
    categoryId: "ec22096c-f944-4c1f-b310-397f7221af31",
    generationKey: "15c430ef-304d-4f06-921f-a4788a9f4176",
    policy: { ...policy, ...overrides },
    priceOptions: [option],
    startsAt: new Date("2026-08-24T00:00:00.000Z"),
  });
}

describe("special offer generator", () => {
  it("normalizes grams and kilograms without floating-point arithmetic", () => {
    expect(weightToMilligrams("80", "G")).toBe(80_000n);
    expect(weightToMilligrams("0.08", "KG")).toBe(80_000n);
    expect(weightToMilligrams("1.250", "KG")).toBe(1_250_000n);
  });

  it("generates at most four stable bulk tiers between 80 g and 1 kg", () => {
    const first = generate();
    const second = generate();
    expect(first.offers).toHaveLength(4);
    expect(second.offers).toEqual(first.offers);
    expect(first.offers.map((offer) => offer.bundleQuantity)).toEqual([
      1, 4, 7, 10,
    ]);
    expect(first.offers.at(-1)).toMatchObject({
      totalWeightGrams: "1000",
      discountBps: 1_500,
      endsAt: new Date("2026-08-25T00:00:00.000Z"),
    });
  });

  it("never discounts below cost plus the protected margin", () => {
    const result = generateSpecialOffers({
      categoryId: "ec22096c-f944-4c1f-b310-397f7221af31",
      generationKey: "15c430ef-304d-4f06-921f-a4788a9f4176",
      policy,
      priceOptions: [{ ...option, costMinor: 8_000n }],
      startsAt: new Date("2026-08-24T00:00:00.000Z"),
    });
    for (const offer of result.offers) {
      const costTotal = 8_000n * BigInt(offer.bundleQuantity);
      const safeFloor = (costTotal * 11_500n + 9_999n) / 10_000n;
      expect(offer.offerTotalMinor).toBeGreaterThanOrEqual(safeFloor);
      expect(offer.discountBps).toBeLessThanOrEqual(1_500);
    }
  });

  it("excludes price options without a real cost price", () => {
    const result = generateSpecialOffers({
      categoryId: "ec22096c-f944-4c1f-b310-397f7221af31",
      generationKey: "15c430ef-304d-4f06-921f-a4788a9f4176",
      policy,
      priceOptions: [{ ...option, costMinor: null }],
      startsAt: new Date("2026-08-24T00:00:00.000Z"),
    });
    expect(result.offers).toEqual([]);
    expect(result.exclusions).toContainEqual({
      priceOptionId: option.priceOptionId,
      bundleQuantity: null,
      code: "COST_REQUIRED",
    });
  });

  it("keeps currencies explicit and never performs conversion", () => {
    const result = generateSpecialOffers({
      categoryId: "ec22096c-f944-4c1f-b310-397f7221af31",
      generationKey: "15c430ef-304d-4f06-921f-a4788a9f4176",
      policy,
      priceOptions: [
        option,
        {
          ...option,
          priceOptionId: "676626c7-4b27-4b06-8477-822d7b90878c",
          currency: "GBP",
        },
      ],
      startsAt: new Date("2026-08-24T00:00:00.000Z"),
    });
    expect(new Set(result.offers.map((offer) => offer.currency))).toEqual(
      new Set(["EUR", "GBP"]),
    );
  });
});
