import { describe, expect, it } from "vitest";
import {
  isPaymentMethod,
  paymentMethodLabel,
} from "@/features/payments/payment-method";

describe("payment method contract", () => {
  it("recognizes only supported methods", () => {
    expect(isPaymentMethod("BITCOIN_DEPOSIT")).toBe(true);
    expect(isPaymentMethod("CARD")).toBe(false);
  });

  it("provides customer-safe labels", () => {
    expect(paymentMethodLabel("RECHARGE_FROM_STORE")).toBe(
      "Recharge from store",
    );
    expect(paymentMethodLabel("RECHARGE_ONLINE", "DUNDLE")).toBe(
      "Recharge online · DUNDLE",
    );
    expect(paymentMethodLabel("BITCOIN_DEPOSIT")).toBe("Bitcoin — 50% deposit");
  });
});
