import { describe, expect, it } from "vitest";
import {
  BITCOIN_PAYMENT_POLICY,
  calculateBitcoinDeposit,
} from "@/features/bitcoin/policy";

describe("Bitcoin payment policy", () => {
  it("requires half now and preserves the exact authoritative total", () => {
    expect(calculateBitcoinDeposit(10_000)).toEqual({
      depositMinor: 5_000,
      remainingCashMinor: 5_000,
    });
    expect(calculateBitcoinDeposit(101)).toEqual({
      depositMinor: 51,
      remainingCashMinor: 50,
    });
  });

  it("is fail-safe for invalid totals", () => {
    expect(() => calculateBitcoinDeposit(-1)).toThrow(TypeError);
    expect(() => calculateBitcoinDeposit(1.5)).toThrow(TypeError);
  });

  it("requires provider settlement before confirmation", () => {
    expect(BITCOIN_PAYMENT_POLICY.confirmationState).toBe("SETTLED");
    expect(BITCOIN_PAYMENT_POLICY.depositBasisPoints).toBe(5_000);
  });
});
