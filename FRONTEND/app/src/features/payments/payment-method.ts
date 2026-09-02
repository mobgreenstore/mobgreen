export const PAYMENT_METHODS = [
  "RECHARGE_FROM_STORE",
  "RECHARGE_ONLINE",
  "BITCOIN_DEPOSIT",
] as const;

export type PaymentMethodId = (typeof PAYMENT_METHODS)[number];

export function isPaymentMethod(value: string): value is PaymentMethodId {
  return PAYMENT_METHODS.some((method) => method === value);
}

export function paymentMethodLabel(
  method: PaymentMethodId,
  rechargeProvider?: string | null,
) {
  if (method === "RECHARGE_FROM_STORE") return "Recharge from store";
  if (method === "BITCOIN_DEPOSIT") return "Bitcoin — 50% deposit";
  return rechargeProvider
    ? `Recharge online · ${rechargeProvider}`
    : "Recharge online";
}
