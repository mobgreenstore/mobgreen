import { describe, expect, it, vi } from "vitest";
import {
  BtcPayClient,
  BtcPayProviderError,
} from "@/features/bitcoin/server/btcpay-client";
import type { BitcoinEnvironment } from "@/features/bitcoin/server/environment";

const environment: BitcoinEnvironment = {
  BITCOIN_CHECKOUT_ENABLED: "true",
  BTCPAY_SERVER_URL: "https://pay.example.com",
  BTCPAY_STORE_ID: "store-1",
  BTCPAY_API_KEY: "api-key-with-enough-length",
  BTCPAY_WEBHOOK_SECRET: "webhook-secret-with-enough-length",
  BTC_RECEIVING_ADDRESS: "bc1qexampleaddresslongenough",
};

describe("BTCPay client", () => {
  it("creates a unique invoice from a server-calculated fiat deposit", async () => {
    const fetchImpl = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            id: "invoice-1",
            status: "New",
            expirationTime: 1_800_000_000,
          }),
          { status: 200 },
        ),
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify([
            {
              paymentMethodId: "BTC-CHAIN",
              destination: "bc1qdestination",
              paymentLink: "bitcoin:bc1qdestination?amount=0.001",
              amount: "0.001",
            },
          ]),
          { status: 200 },
        ),
      );
    const result = await new BtcPayClient(
      environment,
      fetchImpl as typeof fetch,
    ).createInvoice({
      checkoutIntentId: "intent-public-id",
      depositMinor: 5_001,
      currency: "EUR",
      expirationMinutes: 15,
    });
    const createRequest = fetchImpl.mock.calls[0]?.[1] as RequestInit;
    expect(JSON.parse(String(createRequest.body))).toMatchObject({
      amount: "50.01",
      currency: "EUR",
      metadata: { checkoutIntentId: "intent-public-id" },
    });
    expect(result).toMatchObject({
      providerInvoiceId: "invoice-1",
      status: "NEW",
      bitcoinAmount: "0.001",
    });
  });

  it("returns a generic error when the provider rejects a request", async () => {
    const fetchImpl = vi
      .fn()
      .mockResolvedValue(new Response(null, { status: 503 }));
    await expect(
      new BtcPayClient(environment, fetchImpl as typeof fetch).createInvoice({
        checkoutIntentId: "intent-public-id",
        depositMinor: 5_000,
        currency: "USD",
        expirationMinutes: 15,
      }),
    ).rejects.toBeInstanceOf(BtcPayProviderError);
  });
});
