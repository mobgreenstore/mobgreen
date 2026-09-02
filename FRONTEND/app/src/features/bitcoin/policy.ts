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
