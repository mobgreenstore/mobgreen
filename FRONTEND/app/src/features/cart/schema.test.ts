import { describe, expect, it } from "vitest";
import { validateCartRequestSchema } from "@/features/cart/schema";

const line = {
  productId: "a06af44a-68ca-4aef-95db-321fe6fd9e11",
  priceOptionId: "a70d9361-91cd-4d47-873f-7e5780fa23cc",
  quantity: 2,
};

describe("cart write boundary", () => {
  it("accepts identifier and quantity input only", () => {
    expect(validateCartRequestSchema.parse({ lines: [line] })).toEqual({
      lines: [line],
    });
  });

  it("accepts an opaque offer identifier without accepting offer prices", () => {
    const offerLine = { ...line, specialOfferId: "a".repeat(32) };
    expect(validateCartRequestSchema.parse({ lines: [offerLine] })).toEqual({
      lines: [offerLine],
    });
    expect(
      validateCartRequestSchema.safeParse({
        lines: [{ ...offerLine, offerTotalMinor: 1 }],
      }).success,
    ).toBe(false);
    expect(
      validateCartRequestSchema.safeParse({
        lines: [{ ...line, specialOfferId: "forged" }],
      }).success,
    ).toBe(false);
  });

  it("rejects browser-provided prices and duplicate identities", () => {
    expect(
      validateCartRequestSchema.safeParse({
        lines: [{ ...line, priceMinor: 1 }],
      }).success,
    ).toBe(false);
    expect(
      validateCartRequestSchema.safeParse({ lines: [line, line] }).success,
    ).toBe(false);
  });
});
