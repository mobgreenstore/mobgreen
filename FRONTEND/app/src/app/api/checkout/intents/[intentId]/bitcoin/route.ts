import { randomBytes } from "node:crypto";
import { NextRequest } from "next/server";
import {
  calculateBitcoinDeposit,
  bitcoinDecimalToSatoshis,
} from "@/features/bitcoin/policy";
import { getBitcoinEnvironment } from "@/features/bitcoin/server/environment";
import { NowPaymentsClient } from "@/features/bitcoin/server/nowpayments-client";
import { checkoutIntentIdSchema } from "@/features/delivery-matching/schema";
import { prisma } from "@/server/db/client";
import { requireGuestSession } from "@/server/guest-session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function fail(message: string, status = 400) {
  return Response.json(
    { error: message },
    { status, headers: { "Cache-Control": "private, no-store" } },
  );
}

function view(attempt: {
  publicId: string;
  providerInvoiceId: string | null;
  paymentAddress: string | null;
  expectedSatoshis: bigint | null;
  depositMinor: bigint;
  cashBalanceDueMinor: bigint;
  status: string;
  expiresAt: Date | null;
}) {
  return {
    publicId: attempt.publicId,
    providerInvoiceId: attempt.providerInvoiceId,
    paymentAddress: attempt.paymentAddress,
    paymentUri:
      attempt.paymentAddress && attempt.expectedSatoshis !== null
        ? `bitcoin:${attempt.paymentAddress}?amount=${(Number(attempt.expectedSatoshis) / 100_000_000).toFixed(8)}`
        : null,
    bitcoinAmount:
      attempt.expectedSatoshis === null
        ? null
        : (Number(attempt.expectedSatoshis) / 100_000_000).toFixed(8),
    depositMinor: Number(attempt.depositMinor),
    cashBalanceMinor: Number(attempt.cashBalanceDueMinor),
    status: attempt.status,
    expiresAt: attempt.expiresAt?.toISOString() ?? null,
  };
}

export async function GET(
  request: NextRequest,
  context: RouteContext<"/api/checkout/intents/[intentId]/bitcoin">,
) {
  const guest = await requireGuestSession(request);
  if (!guest) return fail("Checkout not found.", 404);
  const intentId = checkoutIntentIdSchema.safeParse(
    (await context.params).intentId,
  );
  if (!intentId.success) return fail("Checkout not found.", 404);
  const attempt = await prisma.paymentAttempt.findFirst({
    where: {
      checkoutIntent: { publicId: intentId.data, guestSessionId: guest.id },
      provider: "NOWPAYMENTS",
    },
    orderBy: { createdAt: "desc" },
    select: {
      publicId: true,
      providerInvoiceId: true,
      paymentAddress: true,
      expectedSatoshis: true,
      depositMinor: true,
      cashBalanceDueMinor: true,
      status: true,
      expiresAt: true,
    },
  });
  return Response.json(
    { attempt: attempt ? view(attempt) : null },
    { headers: { "Cache-Control": "private, no-store" } },
  );
}

export async function POST(
  request: NextRequest,
  context: RouteContext<"/api/checkout/intents/[intentId]/bitcoin">,
) {
  const guest = await requireGuestSession(request);
  if (!guest) return fail("Checkout not found.", 404);
  const parsed = checkoutIntentIdSchema.safeParse(
    (await context.params).intentId,
  );
  if (!parsed.success) return fail("Checkout not found.", 404);
  const environment = getBitcoinEnvironment();
  if (!environment)
    return fail("Bitcoin checkout is temporarily unavailable.", 503);
  const intent = await prisma.checkoutIntent.findFirst({
    where: {
      publicId: parsed.data,
      guestSessionId: guest.id,
      paymentMethod: "BITCOIN_DEPOSIT",
    },
    select: {
      id: true,
      publicId: true,
      currency: true,
      subtotalMinor: true,
      customerEmail: true,
    },
  });
  if (!intent) return fail("Checkout not found.", 404);
  const existing = await prisma.paymentAttempt.findFirst({
    where: {
      checkoutIntentId: intent.id,
      provider: "NOWPAYMENTS",
      status: {
        in: ["CREATED", "INVOICE_PENDING", "PAYMENT_DETECTED", "CONFIRMING"],
      },
    },
    orderBy: { createdAt: "desc" },
    select: {
      publicId: true,
      providerInvoiceId: true,
      paymentAddress: true,
      expectedSatoshis: true,
      depositMinor: true,
      cashBalanceDueMinor: true,
      status: true,
      expiresAt: true,
    },
  });
  if (existing && (!existing.expiresAt || existing.expiresAt > new Date()))
    return Response.json(
      { attempt: view(existing) },
      { headers: { "Cache-Control": "private, no-store" } },
    );
  const split = calculateBitcoinDeposit(Number(intent.subtotalMinor));
  const callbackUrl = `${(process.env.NEXT_PUBLIC_STOREFRONT_URL ?? process.env.NEXT_PUBLIC_APP_URL ?? "https://mobgreen.store").replace(/\/$/, "")}/api/payments/nowpayments/ipn`;
  const invoice = await new NowPaymentsClient(environment).createInvoice({
    checkoutIntentId: intent.publicId,
    depositMinor: split.depositMinor,
    currency: intent.currency,
    expirationMinutes: 15,
    callbackUrl,
    orderDescription: `MOB GREENS checkout ${intent.publicId}`,
  });
  const created = await prisma.paymentAttempt.create({
    data: {
      publicId: randomBytes(24).toString("base64url"),
      checkoutIntentId: intent.id,
      paymentMethod: "BITCOIN_DEPOSIT",
      provider: "NOWPAYMENTS",
      currency: intent.currency,
      orderTotalMinor: intent.subtotalMinor,
      depositMinor: BigInt(split.depositMinor),
      cashBalanceDueMinor: BigInt(split.remainingCashMinor),
      expectedSatoshis: bitcoinDecimalToSatoshis(invoice.bitcoinAmount),
      providerInvoiceId: invoice.providerInvoiceId,
      paymentAddress: invoice.destination,
      status: "INVOICE_PENDING",
      expiresAt: invoice.expiresAt,
      events: {
        create: {
          eventType: "INVOICE_CREATED",
          toStatus: "INVOICE_PENDING",
          metadata: { provider: "NOWPAYMENTS" },
        },
      },
    },
    select: {
      publicId: true,
      providerInvoiceId: true,
      paymentAddress: true,
      expectedSatoshis: true,
      depositMinor: true,
      cashBalanceDueMinor: true,
      status: true,
      expiresAt: true,
    },
  });
  return Response.json(
    { attempt: view(created) },
    { status: 201, headers: { "Cache-Control": "private, no-store" } },
  );
}
