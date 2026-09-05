import { describe, expect, it, vi } from "vitest";
import {
  NowPaymentsClient,
  NowPaymentsProviderError,
} from "@/features/bitcoin/server/nowpayments-client";
import type { BitcoinEnvironment } from "@/features/bitcoin/server/environment";

const environment: BitcoinEnvironment = {
  BITCOIN_CHECKOUT_ENABLED: "true",
  NOWPAYMENTS_API_URL: "https://api.nowpayments.io",
  NOWPAYMENTS_API_KEY: "api-key-with-enough-length",
  NOWPAYMENTS_IPN_SECRET: "webhook-secret-with-enough-length",
  BTC_RECEIVING_ADDRESS: "bc1qexampleaddresslongenough",
};

describe("NOWPayments client", () => {
  it("creates a payment from an authoritative fiat deposit", async () => {
    const fetchImpl = vi.fn().mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          payment_id: "payment-1",
          payment_status: "waiting",
          pay_amount: 0.001,
          pay_address: "bc1qdestination",
          expiration_estimate_date: "2026-09-03T12:00:00.000Z",
        }),
        { status: 200 },
      ),
    );
    const result = await new NowPaymentsClient(
      environment,
      fetchImpl as typeof fetch,
    ).createInvoice({
      checkoutIntentId: "intent-public-id",
      depositMinor: 5_001,
      currency: "EUR",
      expirationMinutes: 15,
      callbackUrl: "https://mobgreen.store/api/payments/nowpayments/ipn",
    });
    const request = fetchImpl.mock.calls[0]?.[1] as RequestInit;
    expect(JSON.parse(String(request.body))).toMatchObject({
      price_amount: 50.01,
      price_currency: "eur",
      pay_currency: "btc",
      payout_address: environment.BTC_RECEIVING_ADDRESS,
      payout_currency: "btc",
      order_id: "intent-public-id",
    });
    expect(result).toMatchObject({
      providerInvoiceId: "payment-1",
      status: "NEW",
      bitcoinAmount: "0.001",
    });
  });

  it("returns a generic error when NOWPayments rejects a request", async () => {
    const fetchImpl = vi
      .fn()
      .mockResolvedValue(new Response(null, { status: 503 }));
    await expect(
      new NowPaymentsClient(
        environment,
        fetchImpl as typeof fetch,
      ).createInvoice({
        checkoutIntentId: "intent-public-id",
        depositMinor: 5_000,
        currency: "USD",
        expirationMinutes: 15,
        callbackUrl: "https://mobgreen.store/api/payments/nowpayments/ipn",
      }),
    ).rejects.toBeInstanceOf(NowPaymentsProviderError);
  });
});
