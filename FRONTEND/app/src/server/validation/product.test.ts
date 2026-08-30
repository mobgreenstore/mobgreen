import { describe, expect, it } from "vitest";
import {
  bulkProductFormSchema,
  productFormSchema,
} from "@/server/validation/product";

const categoryId = "124bf462-6765-451c-8db8-d47976ec9595";

function option(currency: "GBP" | "EUR" | "USD", priceMinor: bigint) {
  return {
    weightValue: 500,
    weightUnit: "G" as const,
    currency,
    priceMinor,
    position: currency === "GBP" ? 0 : 1,
    isActive: true,
  };
}

describe("product write schema", () => {
  it("requires a price option before activation", () => {
    const result = productFormSchema.safeParse({
      categoryId,
      name: "Spinach",
      shortDescription: "Fresh spinach",
      status: "ACTIVE",
      images: [],
      priceOptions: [],
    });
    expect(result.success).toBe(false);
    expect(result.error?.flatten().fieldErrors.priceOptions).toContain(
      "An active product needs at least one active price option.",
    );
  });

  it("preserves explicit prices per currency without conversion", () => {
    const result = productFormSchema.parse({
      categoryId,
      name: "Spinach",
      shortDescription: "Fresh spinach",
      status: "ACTIVE",
      images: [],
      priceOptions: [option("GBP", 250n), option("EUR", 300n)],
    });
    expect(result.priceOptions).toEqual([
      expect.objectContaining({ currency: "GBP", priceMinor: 250n }),
      expect.objectContaining({ currency: "EUR", priceMinor: 300n }),
    ]);
  });

  it("limits one bulk write to ten products", () => {
    const draft = {
      categoryId,
      name: "Spinach",
      shortDescription: "Fresh spinach",
      status: "DRAFT",
      images: [],
      priceOptions: [],
    };
    expect(
      bulkProductFormSchema.safeParse({
        products: Array.from({ length: 10 }, () => draft),
      }).success,
    ).toBe(true);
    expect(
      bulkProductFormSchema.safeParse({
        products: Array.from({ length: 11 }, () => draft),
      }).success,
    ).toBe(false);
  });

  it("accepts only grams and kilograms", () => {
    const valid = productFormSchema.safeParse({
      categoryId,
      name: "Spinach",
      shortDescription: "Fresh spinach",
      status: "DRAFT",
      images: [],
      priceOptions: [option("USD", 500n)],
    });
    const invalid = productFormSchema.safeParse({
      categoryId,
      name: "Spinach",
      shortDescription: "Fresh spinach",
      status: "DRAFT",
      images: [],
      priceOptions: [{ ...option("USD", 500n), weightUnit: "LB" }],
    });
    expect(valid.success).toBe(true);
    expect(invalid.success).toBe(false);
  });
});
