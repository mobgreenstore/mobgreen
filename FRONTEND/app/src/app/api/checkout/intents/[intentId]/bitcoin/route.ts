import { NextRequest } from "next/server";
import {
  bitcoinDecimalToSatoshis,
  satoshisToBitcoinDecimal,
} from "@/features/bitcoin/policy";
import {
  BitcoinOrderError,
  prepareBitcoinAttempt,
} from "@/features/bitcoin/server/bitcoin-order-service";
import { getBitcoinEnvironment } from "@/features/bitcoin/server/environment";
import {
  NowPaymentsClient,
  NowPaymentsProviderError,
} from "@/features/bitcoin/server/nowpayments-client";
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
  order: { reference: string } | null;
}) {
  return {
    publicId: attempt.publicId,
    providerInvoiceId: attempt.providerInvoiceId,
    paymentAddress: attempt.paymentAddress,
    paymentUri:
      attempt.paymentAddress && attempt.expectedSatoshis !== null
        ? `bitcoin:${attempt.paymentAddress}?amount=${satoshisToBitcoinDecimal(attempt.expectedSatoshis)}`
        : null,
    bitcoinAmount:
      attempt.expectedSatoshis === null
        ? null
        : satoshisToBitcoinDecimal(attempt.expectedSatoshis),
    depositMinor: Number(attempt.depositMinor),
    cashBalanceMinor: Number(attempt.cashBalanceDueMinor),
    status: attempt.status,
    expiresAt: attempt.expiresAt?.toISOString() ?? null,
    orderReference: attempt.order?.reference ?? null,
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
      order: { select: { reference: true } },
    },
  });
  return Response.json(
    {
      attempt:
        attempt?.status === "CREATED" && !attempt.providerInvoiceId
          ? null
          : attempt
            ? view(attempt)
            : null,
    },
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
  let prepared;
  try {
    prepared = await prepareBitcoinAttempt(parsed.data, guest.id);
  } catch (error) {
    if (error instanceof BitcoinOrderError)
      return fail(error.message, error.status);
    throw error;
  }
  if (!prepared.created) {
    if (prepared.attempt.providerInvoiceId)
      return Response.json(
        { attempt: view(prepared.attempt) },
        { headers: { "Cache-Control": "private, no-store" } },
      );
    return fail("Bitcoin invoice preparation is already in progress.", 409);
  }
  const callbackUrl = `${(process.env.NEXT_PUBLIC_STOREFRONT_URL ?? process.env.NEXT_PUBLIC_APP_URL ?? "https://mobgreen.store").replace(/\/$/, "")}/api/payments/nowpayments/ipn`;
  let invoice;
  try {
    invoice = await new NowPaymentsClient(environment).createInvoice({
      ...prepared.invoice,
      expirationMinutes: 15,
      callbackUrl,
      orderDescription: `MOB GREENS checkout ${prepared.invoice.checkoutIntentId}`,
    });
  } catch (error) {
    try {
      await prisma.paymentAttempt.update({
        where: { id: prepared.attempt.id },
        data: {
          status: "FAILED",
          failedAt: new Date(),
          events: {
            create: {
              eventType: "INVOICE_CREATION_FAILED",
              fromStatus: "CREATED",
              toStatus: "FAILED",
            },
          },
        },
      });
    } catch {
      // Keep the provider response generic. A stranded CREATED attempt is
      // deliberately not retried automatically because an invoice may exist.
    }
    if (error instanceof NowPaymentsProviderError)
      return fail("Bitcoin payment service is temporarily unavailable.", 503);
    return fail("Bitcoin invoice could not be created.", 503);
  }
  let created;
  try {
    created = await prisma.paymentAttempt.update({
      where: { id: prepared.attempt.id },
      data: {
        expectedSatoshis: bitcoinDecimalToSatoshis(invoice.bitcoinAmount),
        providerInvoiceId: invoice.providerInvoiceId,
        paymentAddress: invoice.destination,
        status: "INVOICE_PENDING",
        expiresAt: invoice.expiresAt,
        events: {
          create: {
            eventType: "INVOICE_CREATED",
            fromStatus: "CREATED",
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
        order: { select: { reference: true } },
      },
    });
  } catch {
    return fail(
      "The Bitcoin invoice was created but could not be linked safely. Contact support before retrying.",
      503,
    );
  }
  return Response.json(
    { attempt: view(created) },
    { status: 201, headers: { "Cache-Control": "private, no-store" } },
  );
}
