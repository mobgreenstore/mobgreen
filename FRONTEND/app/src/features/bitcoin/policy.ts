export const BITCOIN_PAYMENT_POLICY = {
  depositBasisPoints: 5_000,
  quoteTtlMinutes: 15,
  confirmationState: "SETTLED",
  networkFeePaidBy: "CUSTOMER",
  underpaymentHandling: "REMAIN_PENDING",
  overpaymentHandling: "MANUAL_REVIEW",
  refundHandling: "MANUAL_REVIEW",
  cancellationHandling: "EXPIRE_UNPAID_INVOICE",
  cashCollectionHandling: "ADMIN_CONFIRMATION_REQUIRED",
} as const;

export function calculateBitcoinDeposit(totalMinor: number) {
  if (!Number.isSafeInteger(totalMinor) || totalMinor < 0) {
    throw new TypeError("Order total must be a non-negative safe integer.");
  }
  const depositMinor = Math.ceil(totalMinor / 2);
  return {
    depositMinor,
    remainingCashMinor: totalMinor - depositMinor,
  };
}

export function bitcoinDecimalToSatoshis(amount: string): bigint {
  const normalized = amount.trim();
  if (!/^(0|[1-9]\d*)(\.\d{1,8})?$/.test(normalized)) {
    throw new TypeError("Bitcoin amount must use at most eight decimals.");
  }
  const [whole = "0", fraction = ""] = normalized.split(".");
  return BigInt(whole) * 100_000_000n + BigInt(fraction.padEnd(8, "0"));
}

export type BitcoinReceiptState =
  "AWAITING" | "UNDERPAID" | "SETTLED" | "OVERPAID";

export function classifyBitcoinReceipt(
  expectedSatoshis: bigint,
  receivedSatoshis: bigint,
): BitcoinReceiptState {
  if (expectedSatoshis <= 0n || receivedSatoshis < 0n) {
    throw new TypeError("Satoshi amounts must be valid non-negative integers.");
  }
  if (receivedSatoshis === 0n) return "AWAITING";
  if (receivedSatoshis < expectedSatoshis) return "UNDERPAID";
  if (receivedSatoshis > expectedSatoshis) return "OVERPAID";
  return "SETTLED";
}

export function bitcoinInvoiceExpired(expiresAt: Date, now = new Date()) {
  if (Number.isNaN(expiresAt.getTime()) || Number.isNaN(now.getTime())) {
    throw new TypeError("Invoice timestamps must be valid dates.");
  }
  return expiresAt.getTime() <= now.getTime();
}
