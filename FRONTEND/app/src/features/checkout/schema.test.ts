import { describe, expect, it } from "vitest";
import { guestCheckoutSchema } from "@/features/checkout/schema";

const input = {
  idempotencyKey: "a06af44a-68ca-4aef-95db-321fe6fd9e11",
  customerName: "Customer Name",
  customerEmail: "customer@example.com",
  fulfillmentType: "PICKUP",
  paymentMethod: "RECHARGE_FROM_STORE",
  rechargeProvider: null,
  verificationCode: "1234567890123456",
  customerNote: "",
  lines: [
    {
      productId: "a70d9361-91cd-4d47-873f-7e5780fa23cc",
      priceOptionId: "ec22096c-f944-4c1f-b310-397f7221af31",
      quantity: 2,
    },
  ],
};

describe("guest checkout validation", () => {
  it("accepts anonymous customer details and numeric verification", () => {
    expect(guestCheckoutSchema.parse(input)).toMatchObject({
      customerEmail: "customer@example.com",
      verificationCode: "1234567890123456",
    });
  });

  it("rejects non-numeric codes and browser prices", () => {
    expect(
      guestCheckoutSchema.safeParse({
        ...input,
        verificationCode: "1234-ABCD",
      }).success,
    ).toBe(false);
    expect(
      guestCheckoutSchema.safeParse({
        ...input,
        lines: [{ ...input.lines[0], priceMinor: 1 }],
      }).success,
    ).toBe(false);
  });

  it("requires a known partner only for online recharge", () => {
    expect(
      guestCheckoutSchema.safeParse({
        ...input,
        paymentMethod: "RECHARGE_ONLINE",
        rechargeProvider: null,
      }).success,
    ).toBe(false);
    expect(
      guestCheckoutSchema.safeParse({
        ...input,
        paymentMethod: "RECHARGE_ONLINE",
        rechargeProvider: "DUNDLE",
      }).success,
    ).toBe(true);
  });
});
