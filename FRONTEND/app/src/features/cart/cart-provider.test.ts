// @vitest-environment jsdom

import { describe, expect, it } from "vitest";
import { addChangeWarnings } from "@/features/cart/cart-provider";
import type { CartValidationResult } from "@/features/cart/types";

function result(
  priceMinor: number,
  productName = "Fresh kale",
): CartValidationResult {
  return {
    lines: [
      {
        key: "product:option",
        productId: "a06af44a-68ca-4aef-95db-321fe6fd9e11",
        priceOptionId: "a70d9361-91cd-4d47-873f-7e5780fa23cc",
        quantity: 1,
        productName,
        productSlug: "fresh-kale",
        image: null,
        option: {
          id: "a70d9361-91cd-4d47-873f-7e5780fa23cc",
          weightValue: 500,
          weightUnit: "G",
          currency: "GBP",
          priceMinor,
          available: true,
        },
        available: true,
        issues: [],
      },
    ],
    itemCount: 1,
    currency: "GBP",
    currencies: ["GBP"],
    subtotalMinor: priceMinor,
    hasCurrencyConflict: false,
    checkoutEligible: true,
  };
}

describe("cart change warnings", () => {
  it("warns when a server-confirmed price changes in memory", () => {
    const changed = addChangeWarnings(result(1500), result(1250));
    expect(changed.lines[0]?.issues).toContainEqual(
      expect.objectContaining({ code: "PRICE_CHANGED" }),
    );
  });

  it("warns when current product details change", () => {
    const changed = addChangeWarnings(
      result(1250, "Fresh organic kale"),
      result(1250),
    );
    expect(changed.lines[0]?.issues).toContainEqual(
      expect.objectContaining({ code: "PRODUCT_CHANGED" }),
    );
  });
});
