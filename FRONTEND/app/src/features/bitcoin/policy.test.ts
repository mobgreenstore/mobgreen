import { describe, expect, it } from "vitest";
import {
  BITCOIN_PAYMENT_POLICY,
  bitcoinDecimalToSatoshis,
  bitcoinInvoiceExpired,
  calculateBitcoinDeposit,
  classifyBitcoinReceipt,
  satoshisToBitcoinDecimal,
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

  it("converts BTC decimal strings to satoshis without floating-point rounding", () => {
    expect(bitcoinDecimalToSatoshis("0.00000001")).toBe(1n);
    expect(bitcoinDecimalToSatoshis("1.23456789")).toBe(123_456_789n);
    expect(() => bitcoinDecimalToSatoshis("0.000000001")).toThrow(TypeError);
    expect(() => bitcoinDecimalToSatoshis("prefix1.0")).toThrow(TypeError);
  });

  it("formats satoshis exactly without converting through Number", () => {
    expect(satoshisToBitcoinDecimal(1n)).toBe("0.00000001");
    expect(satoshisToBitcoinDecimal(123_456_789n)).toBe("1.23456789");
    expect(satoshisToBitcoinDecimal(9_007_199_254_740_993n)).toBe(
      "90071992.54740993",
    );
  });

  it("classifies exact, underpaid, and overpaid receipts", () => {
    expect(classifyBitcoinReceipt(100n, 0n)).toBe("AWAITING");
    expect(classifyBitcoinReceipt(100n, 99n)).toBe("UNDERPAID");
    expect(classifyBitcoinReceipt(100n, 100n)).toBe("SETTLED");
    expect(classifyBitcoinReceipt(100n, 101n)).toBe("OVERPAID");
  });

  it("expires quotes at the server-controlled deadline", () => {
    const deadline = new Date("2026-09-03T10:15:00.000Z");
    expect(
      bitcoinInvoiceExpired(deadline, new Date("2026-09-03T10:14:59.999Z")),
    ).toBe(false);
    expect(bitcoinInvoiceExpired(deadline, deadline)).toBe(true);
  });
});
