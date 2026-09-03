import { describe, expect, it } from "vitest";
import {
  finalizeCheckoutSchema,
  selectCourierSchema,
  startCheckoutIntentSchema,
} from "@/features/delivery-matching/schema";

const base = {
  idempotencyKey: "a06af44a-68ca-4aef-95db-321fe6fd9e11",
  customerName: "Customer Name",
  customerEmail: "customer@example.com",
  fulfillmentType: "PICKUP" as const,
  paymentMethod: "RECHARGE_FROM_STORE" as const,
  rechargeProvider: null,
  deliveryLocation: null,
  lines: [
    {
      productId: "a70d9361-91cd-4d47-873f-7e5780fa23cc",
      priceOptionId: "ec22096c-f944-4c1f-b310-397f7221af31",
      quantity: 1,
    },
  ],
};

describe("delivery matching write boundaries", () => {
  it("allows pickup to bypass matching and delivery to begin without a location", () => {
    expect(startCheckoutIntentSchema.safeParse(base).success).toBe(true);
    expect(
      startCheckoutIntentSchema.safeParse({
        ...base,
        fulfillmentType: "DELIVERY",
      }).success,
    ).toBe(true);
  });

  it("requires an approved online recharge provider", () => {
    const result = startCheckoutIntentSchema.safeParse({
      ...base,
      paymentMethod: "RECHARGE_ONLINE",
      rechargeProvider: null,
    });
    expect(result.success).toBe(false);
  });

  it("accepts Bitcoin only without a recharge partner", () => {
    expect(
      startCheckoutIntentSchema.safeParse({
        ...base,
        paymentMethod: "BITCOIN_DEPOSIT",
      }).success,
    ).toBe(true);
    expect(
      startCheckoutIntentSchema.safeParse({
        ...base,
        paymentMethod: "BITCOIN_DEPOSIT",
        rechargeProvider: "DUNDLE",
      }).success,
    ).toBe(false);
  });

  it("rejects altered intent and courier identifiers", () => {
    expect(
      selectCourierSchema.safeParse({
        intentId: "sequential-1",
        courierCandidateId: "courier-mx-97",
      }).success,
    ).toBe(false);
    expect(
      selectCourierSchema.safeParse({
        intentId: "a".repeat(32),
        courierCandidateId: "x",
      }).success,
    ).toBe(false);
  });

  it("accepts digits-only confirmation codes and rejects altered values", () => {
    expect(
      finalizeCheckoutSchema.safeParse({
        intentId: "a".repeat(32),
        verificationCodes: ["1234567890"],
        customerNote: "",
      }).success,
    ).toBe(true);
    expect(
      finalizeCheckoutSchema.safeParse({
        intentId: "a".repeat(32),
        verificationCodes: ["1234-ABCD"],
      }).success,
    ).toBe(false);
  });
});
