import { describe, expect, it } from "vitest";
import { productPriceOptionWriteSchema } from "@/server/validation/product";

const baseOption = {
  weightValue: 100,
  weightUnit: "G" as const,
  currency: "EUR" as const,
  priceMinor: 10_000n,
  position: 0,
  isActive: true,
};

describe("product price cost validation", () => {
  it("accepts an omitted or profitable private cost", () => {
    expect(productPriceOptionWriteSchema.safeParse(baseOption).success).toBe(
      true,
    );
    expect(
      productPriceOptionWriteSchema.safeParse({
        ...baseOption,
        costMinor: 6_500n,
      }).success,
    ).toBe(true);
  });

  it("rejects a cost at or above the selling price", () => {
    const result = productPriceOptionWriteSchema.safeParse({
      ...baseOption,
      costMinor: 10_000n,
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.flatten().fieldErrors.costMinor).toContain(
        "Cost must be lower than the selling price.",
      );
    }
  });
});
