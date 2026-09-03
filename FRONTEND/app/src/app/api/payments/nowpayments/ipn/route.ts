import { createHash } from "node:crypto";
import { z } from "zod";
import { bitcoinDecimalToSatoshis } from "@/features/bitcoin/policy";
import { getBitcoinEnvironment } from "@/features/bitcoin/server/environment";
import { verifyNowPaymentsWebhookSignature } from "@/features/bitcoin/server/nowpayments-signature";
import { prisma } from "@/server/db/client";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const payloadSchema = z.object({
  payment_id: z.union([z.string(), z.number()]),
  payment_status: z.string(),
  actually_paid: z.union([z.string(), z.number()]).optional(),
  pay_amount: z.union([z.string(), z.number()]).optional(),
  txid: z.string().optional(),
  count: z.number().int().nonnegative().optional(),
});
const statusMap: Record<
  string,
  | "INVOICE_PENDING"
  | "PAYMENT_DETECTED"
  | "CONFIRMING"
  | "SETTLED"
  | "EXPIRED"
  | "FAILED"
> = {
  waiting: "INVOICE_PENDING",
  sending: "PAYMENT_DETECTED",
  partially_paid: "PAYMENT_DETECTED",
  confirming: "CONFIRMING",
  confirmed: "CONFIRMING",
  finished: "SETTLED",
  expired: "EXPIRED",
  failed: "FAILED",
  refunded: "FAILED",
};
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
  const attempt = await prisma.paymentAttempt.findFirst({
    where: { provider: "NOWPAYMENTS", providerInvoiceId },
    select: { id: true, status: true },
  });
  if (!attempt) return Response.json({ ok: true });
  const nextStatus = statusMap[parsed.payment_status.toLowerCase()];
  if (!nextStatus) return Response.json({ ok: true });
  const eventId = `nowpayments:${providerInvoiceId}:${parsed.payment_status.toLowerCase()}:${createHash("sha256").update(rawBody).digest("hex")}`;
  try {
    await prisma.$transaction(async (tx) => {
      await tx.paymentEvent.create({
        data: {
          paymentAttemptId: attempt.id,
          providerEventId: eventId,
          eventType: `NOWPAYMENTS_${parsed.payment_status.toUpperCase()}`,
          fromStatus: attempt.status,
          toStatus: nextStatus,
          metadata: { confirmationCount: parsed.count ?? null },
        },
      });
      const updateData = {
        status: nextStatus,
        ...(parsed.actually_paid !== undefined
          ? {
              receivedSatoshis: bitcoinDecimalToSatoshis(
                String(parsed.actually_paid),
              ),
            }
          : {}),
        ...(parsed.txid !== undefined ? { transactionId: parsed.txid } : {}),
        ...(parsed.count !== undefined
          ? { confirmationCount: parsed.count }
          : {}),
        ...(["PAYMENT_DETECTED", "CONFIRMING", "SETTLED"].includes(nextStatus)
          ? { detectedAt: new Date() }
          : {}),
        ...(nextStatus === "SETTLED" ? { confirmedAt: new Date() } : {}),
        ...(["EXPIRED", "FAILED"].includes(nextStatus)
          ? { failedAt: new Date() }
          : {}),
      };
      await tx.paymentAttempt.update({
        where: { id: attempt.id },
        data: updateData,
      });
    });
  } catch (error) {
    if (!(
      error instanceof Error && error.message.toLowerCase().includes("unique")
    ))
      throw error;
  }
  return Response.json({ ok: true });
}
