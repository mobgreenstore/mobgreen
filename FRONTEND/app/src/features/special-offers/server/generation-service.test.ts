import { describe, expect, it } from "vitest";
import type {
  OfferGenerationCategoryRecord,
  SpecialOfferGenerationSource,
} from "@/features/special-offers/server/generation-source";
import {
  SpecialOfferGenerationError,
  SpecialOfferGenerationService,
} from "@/features/special-offers/server/generation-service";

const categoryId = "ec22096c-f944-4c1f-b310-397f7221af31";
const generationKey = "15c430ef-304d-4f06-921f-a4788a9f4176";
const activeCategory: OfferGenerationCategoryRecord = {
  id: categoryId,
  isActive: true,
  archivedAt: null,
  policy: {
    enabled: true,
    minimumWeightGrams: 80,
    maximumWeightGrams: 1_000,
    minimumDiscountBps: 300,
    maximumDiscountBps: 1_500,
    minimumMarginBps: 1_500,
    durationMinutes: 1_440,
    maxOffersPerPriceOption: 4,
  },
  priceOptions: [
    {
      productId: "a06af44a-68ca-4aef-95db-321fe6fd9e11",
      priceOptionId: "a70d9361-91cd-4d47-873f-7e5780fa23cc",
      weightValue: "100",
      weightUnit: "G",
      currency: "EUR",
      priceMinor: 10_000n,
      costMinor: 6_000n,
    },
  ],
};

function service(record: OfferGenerationCategoryRecord | null) {
  const source: SpecialOfferGenerationSource = {
    loadCategory: async () => record,
  };
  return new SpecialOfferGenerationService(source);
}

describe("database-backed special offer generation boundary", () => {
  it("generates from an active category policy and authoritative options", async () => {
    const result = await service(activeCategory).generate({
      categoryId,
      generationKey,
      startsAt: new Date("2026-08-24T00:00:00.000Z"),
    });
    expect(result.offers).toHaveLength(4);
    expect(result.offers[0]).toMatchObject({ categoryId, currency: "EUR" });
  });

  it("rejects missing, archived, and disabled categories", async () => {
    await expect(
      service(null).generate({
        categoryId,
        generationKey,
        startsAt: new Date(),
      }),
    ).rejects.toBeInstanceOf(SpecialOfferGenerationError);
    await expect(
      service({ ...activeCategory, archivedAt: new Date() }).generate({
        categoryId,
        generationKey,
        startsAt: new Date(),
      }),
    ).rejects.toMatchObject({ code: "CATEGORY_UNAVAILABLE" });
    await expect(
      service({
        ...activeCategory,
        policy: { ...activeCategory.policy!, enabled: false },
      }).generate({ categoryId, generationKey, startsAt: new Date() }),
    ).rejects.toMatchObject({ code: "POLICY_DISABLED" });
  });
});
