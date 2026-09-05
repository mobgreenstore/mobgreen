import { createHash } from "node:crypto";
import { after } from "next/server";
import { z } from "zod";
import { bitcoinDecimalToSatoshis } from "@/features/bitcoin/policy";
import { applyNowPaymentsEvent } from "@/features/bitcoin/server/bitcoin-order-service";
import { getBitcoinEnvironment } from "@/features/bitcoin/server/environment";
import { verifyNowPaymentsWebhookSignature } from "@/features/bitcoin/server/nowpayments-signature";
import {
  dispatchCustomerOrderSubmittedNotification,
  dispatchOrderSubmittedNotification,
} from "@/features/order-notifications/server/service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const payloadSchema = z.object({
  payment_id: z.union([z.string(), z.number()]),
  payment_status: z.enum([
    "waiting",
    "sending",
    "partially_paid",
    "confirming",
    "confirmed",
    "finished",
    "expired",
    "failed",
    "refunded",
  ]),
  actually_paid: z.union([z.string(), z.number()]).optional(),
  pay_amount: z.union([z.string(), z.number()]).optional(),
  txid: z.string().optional(),
  count: z.number().int().nonnegative().optional(),
});
export async function POST(request: Request) {
  const environment = getBitcoinEnvironment();
  if (!environment)
    return Response.json({ error: "Webhook unavailable." }, { status: 503 });
  const rawBody = await request.text();
  const signature = request.headers.get("x-nowpayments-sig");
  if (
    !verifyNowPaymentsWebhookSignature(
      rawBody,
      signature,
      environment.NOWPAYMENTS_IPN_SECRET,
    )
  )
    return Response.json({ error: "Invalid signature." }, { status: 401 });
  let parsed: z.infer<typeof payloadSchema>;
  try {
    parsed = payloadSchema.parse(JSON.parse(rawBody));
  } catch {
    return Response.json({ error: "Invalid payload." }, { status: 400 });
  }
  const providerInvoiceId = String(parsed.payment_id);
  const payloadHash = createHash("sha256").update(rawBody).digest("hex");
  const eventId = `nowpayments:${providerInvoiceId}:${parsed.payment_status}:${payloadHash}`;
  let receivedSatoshis: bigint | null = null;
  if (parsed.actually_paid !== undefined) {
    try {
      receivedSatoshis = bitcoinDecimalToSatoshis(String(parsed.actually_paid));
    } catch {
      return Response.json(
        { error: "Invalid payment amount." },
        { status: 400 },
      );
    }
  }
  try {
    const result = await applyNowPaymentsEvent({
      providerInvoiceId,
      providerEventId: eventId,
      providerStatus: parsed.payment_status,
      receivedSatoshis,
      transactionId: parsed.txid ?? null,
      confirmationCount: parsed.count ?? null,
      payloadHash,
    });
    if (result.settledReference) {
      after(async () => {
        await Promise.allSettled([
          dispatchOrderSubmittedNotification(result.settledReference!),
          dispatchCustomerOrderSubmittedNotification(result.settledReference!),
        ]);
      });
    }
  } catch (error) {
    if (!(
      error instanceof Error && error.message.toLowerCase().includes("unique")
    ))
      throw error;
  }
  return Response.json({ ok: true });
}
