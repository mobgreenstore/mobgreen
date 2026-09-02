import "server-only";

import { z } from "zod";
import type { BitcoinEnvironment } from "@/features/bitcoin/server/environment";
import type { BitcoinInvoiceStatus } from "@/features/bitcoin/types";

const invoiceSchema = z.object({
  id: z.string().min(1),
  status: z.enum(["New", "Processing", "Settled", "Expired", "Invalid"]),
  expirationTime: z.number().int().positive(),
});

const paymentMethodSchema = z.array(
  z.object({
    paymentMethodId: z.string(),
    destination: z.string().min(1),
    paymentLink: z.string().min(1),
    amount: z.string().min(1),
  }),
);

type SupportedCurrency = "GBP" | "EUR" | "USD";
type Fetch = typeof fetch;

export class BtcPayProviderError extends Error {
  constructor(message = "Bitcoin payment service is unavailable.") {
    super(message);
    this.name = "BtcPayProviderError";
  }
}

function fiatAmount(minor: number) {
  if (!Number.isSafeInteger(minor) || minor < 1) {
    throw new TypeError("Invoice amount must be a positive integer.");
  }
  return `${Math.floor(minor / 100)}.${String(minor % 100).padStart(2, "0")}`;
}

function status(value: z.output<typeof invoiceSchema>["status"]) {
  return value.toUpperCase() as BitcoinInvoiceStatus;
}

export type CreatedBtcPayInvoice = {
  providerInvoiceId: string;
  status: BitcoinInvoiceStatus;
  bitcoinAmount: string;
  destination: string;
  paymentUri: string;
  expiresAt: Date;
};

export class BtcPayClient {
  constructor(
    private readonly environment: BitcoinEnvironment,
    private readonly fetchImpl: Fetch = fetch,
  ) {}

  private async request(path: string, init?: RequestInit) {
    const response = await this.fetchImpl(
      new URL(path, this.environment.BTCPAY_SERVER_URL),
      {
        ...init,
        headers: {
          Authorization: `token ${this.environment.BTCPAY_API_KEY}`,
          "content-type": "application/json",
          ...init?.headers,
        },
        signal: AbortSignal.timeout(10_000),
        cache: "no-store",
      },
    );
    if (!response.ok) throw new BtcPayProviderError();
    return response.json();
  }

  async createInvoice(input: {
    checkoutIntentId: string;
    depositMinor: number;
    currency: SupportedCurrency;
    expirationMinutes: number;
  }): Promise<CreatedBtcPayInvoice> {
    const storeId = encodeURIComponent(this.environment.BTCPAY_STORE_ID);
    const invoice = invoiceSchema.parse(
      await this.request(`/api/v1/stores/${storeId}/invoices`, {
        method: "POST",
        body: JSON.stringify({
          amount: fiatAmount(input.depositMinor),
          currency: input.currency,
          metadata: { checkoutIntentId: input.checkoutIntentId },
          checkout: {
            expirationMinutes: input.expirationMinutes,
            monitoringMinutes: input.expirationMinutes,
            paymentMethods: ["BTC"],
          },
        }),
      }),
    );
    const methods = paymentMethodSchema.parse(
      await this.request(
        `/api/v1/stores/${storeId}/invoices/${encodeURIComponent(invoice.id)}/payment-methods`,
      ),
    );
    const bitcoin = methods.find(
      (method) => method.paymentMethodId === "BTC-CHAIN",
    );
    if (!bitcoin) throw new BtcPayProviderError();
    return {
      providerInvoiceId: invoice.id,
      status: status(invoice.status),
      bitcoinAmount: bitcoin.amount,
      destination: bitcoin.destination,
      paymentUri: bitcoin.paymentLink,
      expiresAt: new Date(invoice.expirationTime * 1_000),
    };
  }
}
