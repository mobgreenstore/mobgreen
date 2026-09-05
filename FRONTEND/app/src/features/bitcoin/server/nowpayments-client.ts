import "server-only";

import { z } from "zod";
import type { BitcoinEnvironment } from "@/features/bitcoin/server/environment";
import type { BitcoinInvoiceStatus } from "@/features/bitcoin/types";

type SupportedCurrency = "GBP" | "EUR" | "USD";
type Fetch = typeof fetch;

const paymentSchema = z.object({
  payment_id: z.union([z.string(), z.number()]),
  payment_status: z.string(),
  pay_amount: z.union([z.string().min(1), z.number().finite().positive()]),
  pay_address: z.string().min(1),
  expiration_estimate_date: z.string().datetime().optional(),
});

export class NowPaymentsProviderError extends Error {
  constructor(message = "Bitcoin payment service is unavailable.") {
    super(message);
    this.name = "NowPaymentsProviderError";
  }
}

function fiatAmount(minor: number) {
  if (!Number.isSafeInteger(minor) || minor < 1) {
    throw new TypeError("Invoice amount must be a positive integer.");
  }
  return Number((minor / 100).toFixed(2));
}

function invoiceStatus(value: string): BitcoinInvoiceStatus {
  const normalized = value.toUpperCase();
  if (normalized === "FINISHED") return "SETTLED";
  if (normalized === "EXPIRED") return "EXPIRED";
  if (normalized === "FAILED" || normalized === "REFUNDED") return "INVALID";
  if (normalized === "CONFIRMING" || normalized === "CONFIRMED")
    return "PROCESSING";
  return "NEW";
}

export type CreatedNowPaymentsInvoice = {
  providerInvoiceId: string;
  status: BitcoinInvoiceStatus;
  bitcoinAmount: string;
  destination: string;
  paymentUri: string;
  expiresAt: Date;
};

export class NowPaymentsClient {
  constructor(
    private readonly environment: BitcoinEnvironment,
    private readonly fetchImpl: Fetch = fetch,
  ) {}

  async createInvoice(input: {
    checkoutIntentId: string;
    depositMinor: number;
    currency: SupportedCurrency;
    expirationMinutes: number;
    callbackUrl: string;
    orderDescription?: string;
  }): Promise<CreatedNowPaymentsInvoice> {
    const response = await this.fetchImpl(
      new URL("/v1/payment", this.environment.NOWPAYMENTS_API_URL),
      {
        method: "POST",
        headers: {
          "x-api-key": this.environment.NOWPAYMENTS_API_KEY,
          "content-type": "application/json",
        },
        body: JSON.stringify({
          price_amount: fiatAmount(input.depositMinor),
          price_currency: input.currency.toLowerCase(),
          pay_currency: "btc",
          payout_address: this.environment.BTC_RECEIVING_ADDRESS,
          payout_currency: "btc",
          ipn_callback_url: input.callbackUrl,
          order_id: input.checkoutIntentId,
          order_description: input.orderDescription ?? "MOB GREENS order",
        }),
        signal: AbortSignal.timeout(10_000),
        cache: "no-store",
      },
    );
    if (!response.ok) throw new NowPaymentsProviderError();
    const payment = paymentSchema.parse(await response.json());
    const expiresAt = payment.expiration_estimate_date
      ? new Date(payment.expiration_estimate_date)
      : new Date(Date.now() + input.expirationMinutes * 60_000);
    return {
      providerInvoiceId: String(payment.payment_id),
      status: invoiceStatus(payment.payment_status),
      bitcoinAmount: String(payment.pay_amount),
      destination: payment.pay_address,
      paymentUri: `bitcoin:${payment.pay_address}?amount=${encodeURIComponent(payment.pay_amount)}`,
      expiresAt,
    };
  }
}
