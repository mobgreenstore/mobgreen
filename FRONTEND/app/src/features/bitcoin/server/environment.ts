import "server-only";

import { z } from "zod";

const bitcoinEnvironmentSchema = z.object({
  BITCOIN_CHECKOUT_ENABLED: z.literal("true"),
  BTCPAY_SERVER_URL: z.url(),
  BTCPAY_STORE_ID: z.string().trim().min(1).max(200),
  BTCPAY_API_KEY: z.string().trim().min(20),
  BTCPAY_WEBHOOK_SECRET: z.string().trim().min(20),
  BTC_RECEIVING_ADDRESS: z.string().trim().min(26).max(90),
});

export type BitcoinEnvironment = z.output<typeof bitcoinEnvironmentSchema>;

export function getBitcoinEnvironment(): BitcoinEnvironment | null {
  const parsed = bitcoinEnvironmentSchema.safeParse({
    BITCOIN_CHECKOUT_ENABLED: process.env.BITCOIN_CHECKOUT_ENABLED,
    BTCPAY_SERVER_URL: process.env.BTCPAY_SERVER_URL,
    BTCPAY_STORE_ID: process.env.BTCPAY_STORE_ID,
    BTCPAY_API_KEY: process.env.BTCPAY_API_KEY,
    BTCPAY_WEBHOOK_SECRET: process.env.BTCPAY_WEBHOOK_SECRET,
    BTC_RECEIVING_ADDRESS: process.env.BTC_RECEIVING_ADDRESS,
  });
  return parsed.success ? parsed.data : null;
}

export function isBitcoinCheckoutConfigured() {
  return getBitcoinEnvironment() !== null;
}
