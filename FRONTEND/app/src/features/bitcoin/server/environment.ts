import "server-only";

import { z } from "zod";

const bitcoinEnvironmentSchema = z.object({
  BITCOIN_CHECKOUT_ENABLED: z.literal("true"),
  NOWPAYMENTS_API_URL: z.url(),
  NOWPAYMENTS_API_KEY: z.string().trim().min(20),
  NOWPAYMENTS_IPN_SECRET: z.string().trim().min(20),
  BTC_RECEIVING_ADDRESS: z.string().trim().min(26).max(90),
});

export type BitcoinEnvironment = z.output<typeof bitcoinEnvironmentSchema>;

export function getBitcoinEnvironment(): BitcoinEnvironment | null {
  const parsed = bitcoinEnvironmentSchema.safeParse({
    BITCOIN_CHECKOUT_ENABLED: process.env.BITCOIN_CHECKOUT_ENABLED,
    NOWPAYMENTS_API_URL:
      process.env.NOWPAYMENTS_API_URL ?? "https://api.nowpayments.io",
    NOWPAYMENTS_API_KEY: process.env.NOWPAYMENTS_API_KEY,
    NOWPAYMENTS_IPN_SECRET: process.env.NOWPAYMENTS_IPN_SECRET,
    BTC_RECEIVING_ADDRESS: process.env.BTC_RECEIVING_ADDRESS,
  });
  return parsed.success ? parsed.data : null;
}

export function isBitcoinCheckoutConfigured() {
  return getBitcoinEnvironment() !== null;
}
