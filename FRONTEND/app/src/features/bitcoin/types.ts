export const BITCOIN_INVOICE_STATUSES = [
  "NEW",
  "PROCESSING",
  "SETTLED",
  "EXPIRED",
  "INVALID",
] as const;

export type BitcoinInvoiceStatus = (typeof BITCOIN_INVOICE_STATUSES)[number];

export type BitcoinInvoiceView = {
  providerInvoiceId: string;
  status: BitcoinInvoiceStatus;
  currency: "GBP" | "EUR" | "USD";
  depositMinor: number;
  remainingCashMinor: number;
  bitcoinAmount: string | null;
  destination: string | null;
  paymentUri: string | null;
  expiresAt: string;
};
