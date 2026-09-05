import "server-only";

import { randomBytes } from "node:crypto";
import type { PaymentAttemptStatus } from "@/generated/prisma/client";
import { CartValidationService } from "@/features/cart/server/cart-validation-service";
import { PrismaCartRepository } from "@/features/cart/server/prisma-cart-repository";
import { calculateBitcoinDeposit } from "@/features/bitcoin/policy";
import { parseIntentCartLines } from "@/features/delivery-matching/server/checkout-intent-service";
import {
  createSelectedCourierSimulation,
  trackingCreateData,
} from "@/features/tracking/server/service";
import { withTransaction } from "@/server/db/transaction";

const ACTIVE_ATTEMPTS: PaymentAttemptStatus[] = [
  "CREATED",
  "INVOICE_PENDING",
  "PAYMENT_DETECTED",
  "CONFIRMING",
  "UNDERPAID",
  "OVERPAID",
];

export class BitcoinOrderError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = "BitcoinOrderError";
  }
}

function createReference() {
  const year = new Date().getUTCFullYear();
  return `MG-${year}-${randomBytes(7).toString("hex").toUpperCase()}`;
}

export type PreparedBitcoinAttempt = {
  created: boolean;
  attempt: {
    id: string;
    publicId: string;
    providerInvoiceId: string | null;
    paymentAddress: string | null;
    expectedSatoshis: bigint | null;
    depositMinor: bigint;
    cashBalanceDueMinor: bigint;
    status: PaymentAttemptStatus;
    expiresAt: Date | null;
    order: { reference: string } | null;
  };
  invoice: {
    checkoutIntentId: string;
    depositMinor: number;
    currency: "GBP" | "EUR" | "USD";
  };
};

export async function prepareBitcoinAttempt(
  intentPublicId: string,
  guestSessionId: string,
): Promise<PreparedBitcoinAttempt> {
  return withTransaction(async (transaction) => {
    const intent = await transaction.checkoutIntent.findFirst({
      where: {
        publicId: intentPublicId,
        guestSessionId,
        paymentMethod: "BITCOIN_DEPOSIT",
      },
      include: {
        order: { select: { id: true, reference: true } },
        paymentAttempts: {
          where: { provider: "NOWPAYMENTS", status: { in: ACTIVE_ATTEMPTS } },
          orderBy: { createdAt: "desc" },
          take: 1,
          select: {
            id: true,
            publicId: true,
            providerInvoiceId: true,
            paymentAddress: true,
            expectedSatoshis: true,
            depositMinor: true,
            cashBalanceDueMinor: true,
            status: true,
            expiresAt: true,
            createdAt: true,
            order: { select: { reference: true } },
          },
        },
      },
    });
    if (!intent) throw new BitcoinOrderError("Checkout not found.", 404);
    if (intent.status === "SUBMITTED")
      throw new BitcoinOrderError("This checkout is already complete.", 409);
    if (intent.expiresAt <= new Date() || intent.status === "EXPIRED")
      throw new BitcoinOrderError("This checkout has expired.", 410);
    if (
      intent.fulfillmentType === "DELIVERY" &&
      (!intent.deliveryAddress ||
        intent.destinationLatitude === null ||
        intent.destinationLongitude === null ||
        !intent.selectedCourierProfileId ||
        !intent.selectedCourierName ||
        intent.selectedDistanceMeters === null ||
        intent.selectedDurationSeconds === null)
    )
      throw new BitcoinOrderError(
        "Confirm a location and choose a delivery profile first.",
        400,
      );

    const split = calculateBitcoinDeposit(Number(intent.subtotalMinor));
    const current = intent.paymentAttempts[0];
    const stalePreparation =
      current?.status === "CREATED" &&
      current.createdAt <= new Date(Date.now() - 2 * 60_000);
    if (stalePreparation)
      throw new BitcoinOrderError(
        "Bitcoin invoice preparation could not be recovered safely. Contact support before retrying this checkout.",
        409,
      );
    const expiredInvoice = Boolean(
      current?.expiresAt && current.expiresAt <= new Date(),
    );
    if (current && expiredInvoice) {
      await transaction.paymentAttempt.update({
        where: { id: current.id },
        data: {
          status: "EXPIRED",
          failedAt: new Date(),
          events: {
            create: {
              eventType: "INVOICE_EXPIRED_BEFORE_RETRY",
              fromStatus: current.status,
              toStatus: "EXPIRED",
            },
          },
        },
      });
    }
    if (current && !expiredInvoice)
      return {
        created: false,
        attempt: current,
        invoice: {
          checkoutIntentId: intent.publicId,
          depositMinor: split.depositMinor,
          currency: intent.currency,
        },
      };

    const lines = parseIntentCartLines(intent.cartLines);
    const cart = await new CartValidationService(
      new PrismaCartRepository(transaction),
    ).validate(lines);
    if (
      !cart.checkoutEligible ||
      cart.currency !== intent.currency ||
      cart.subtotalMinor === null ||
      BigInt(cart.subtotalMinor) !== intent.subtotalMinor
    )
      throw new BitcoinOrderError(
        "A product or price changed. Review the card and retry.",
        409,
      );

    const offerPublicIds = lines.flatMap((line) =>
      line.specialOfferId ? [line.specialOfferId] : [],
    );
    const offers = offerPublicIds.length
      ? await transaction.specialOffer.findMany({
          where: { publicId: { in: offerPublicIds } },
          select: { id: true, publicId: true },
        })
      : [];
    const offerIds = new Map(offers.map((offer) => [offer.publicId, offer.id]));
    const snapshots = cart.lines.flatMap((line) => {
      if (!line.available || !line.option) return [];
      const offerId = line.specialOfferId
        ? offerIds.get(line.specialOfferId)
        : null;
      return [
        {
          productId: line.productId,
          priceOptionId: line.priceOptionId,
          specialOfferId: offerId ?? null,
          productNameSnapshot: line.productName,
          productImageUrlSnapshot: line.image?.url ?? null,
          productImageAltTextSnapshot: line.image?.altText ?? null,
          productImagePublicIdSnapshot: null,
          weightValueSnapshot: line.option.weightValue,
          weightUnitSnapshot: line.option.weightUnit,
          currencySnapshot: line.option.currency,
          unitPriceMinor: BigInt(line.option.priceMinor),
          quantity: line.quantity,
          lineTotalMinor: BigInt(line.option.priceMinor * line.quantity),
          offerOriginalTotalMinorSnapshot:
            line.offer?.originalTotalMinor !== undefined
              ? BigInt(line.offer.originalTotalMinor)
              : null,
          offerDiscountBpsSnapshot: line.offer?.discountBps ?? null,
          offerDiscountMinorSnapshot:
            line.offer?.discountMinor !== undefined
              ? BigInt(line.offer.discountMinor)
              : null,
          offerTotalMinorSnapshot: line.offer
            ? BigInt(line.option.priceMinor)
            : null,
          offerBundleQuantitySnapshot: line.offer?.bundleQuantity ?? null,
          offerEndsAtSnapshot: line.offer ? new Date(line.offer.endsAt) : null,
        },
      ];
    });

    const order =
      intent.order ??
      (await transaction.order.create({
        data: {
          reference: createReference(),
          idempotencyKey: intent.idempotencyKey,
          guestSessionId,
          checkoutIntentId: intent.id,
          customerName: intent.customerName,
          customerEmail: intent.customerEmail,
          fulfillmentType: intent.fulfillmentType,
          deliveryAddress: intent.deliveryAddress,
          deliveryPostalCode: intent.deliveryPostalCode,
          deliveryLocality: intent.deliveryLocality,
          deliveryCountryCode: intent.deliveryCountryCode,
          destinationLatitude: intent.destinationLatitude,
          destinationLongitude: intent.destinationLongitude,
          destinationMapboxPlaceId: intent.destinationMapboxPlaceId,
          courierProfileIdSnapshot: intent.selectedCourierProfileId,
          courierNameSnapshot: intent.selectedCourierName,
          courierDistanceMeters: intent.selectedDistanceMeters,
          courierDurationSeconds: intent.selectedDurationSeconds,
          currency: intent.currency,
          subtotalMinor: intent.subtotalMinor,
          totalMinor: intent.subtotalMinor,
          status: "PENDING",
          paymentStatus: "PENDING",
          paymentMethod: "BITCOIN_DEPOSIT",
          items: { create: snapshots },
          statusEvents: {
            create: {
              toStatus: "PENDING",
              note: "Bitcoin invoice preparation started.",
            },
          },
          paymentStatusEvents: {
            create: {
              toStatus: "PENDING",
              note: "Awaiting the Bitcoin deposit.",
            },
          },
        },
        select: { id: true, reference: true },
      }));

    const attempt = await transaction.paymentAttempt.create({
      data: {
        publicId: randomBytes(24).toString("base64url"),
        checkoutIntentId: intent.id,
        orderId: order.id,
        paymentMethod: "BITCOIN_DEPOSIT",
        provider: "NOWPAYMENTS",
        currency: intent.currency,
        orderTotalMinor: intent.subtotalMinor,
        depositMinor: BigInt(split.depositMinor),
        cashBalanceDueMinor: BigInt(split.remainingCashMinor),
        status: "CREATED",
        events: {
          create: { eventType: "INVOICE_REQUESTED", toStatus: "CREATED" },
        },
      },
      select: {
        id: true,
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
    return {
      created: true,
      attempt,
      invoice: {
        checkoutIntentId: intent.publicId,
        depositMinor: split.depositMinor,
        currency: intent.currency,
      },
    };
  });
}

type NowPaymentsStatus =
  | "waiting"
  | "sending"
  | "partially_paid"
  | "confirming"
  | "confirmed"
  | "finished"
  | "expired"
  | "failed"
  | "refunded";

export function nextBitcoinAttemptStatus(input: {
  providerStatus: NowPaymentsStatus;
  expectedSatoshis: bigint;
  receivedSatoshis: bigint;
}): PaymentAttemptStatus {
  if (input.receivedSatoshis > input.expectedSatoshis) return "OVERPAID";
  if (
    input.providerStatus === "partially_paid" ||
    (input.receivedSatoshis > 0n &&
      input.receivedSatoshis < input.expectedSatoshis)
  )
    return "UNDERPAID";
  if (input.providerStatus === "finished")
    return input.receivedSatoshis === input.expectedSatoshis
      ? "SETTLED"
      : "UNDERPAID";
  if (
    input.providerStatus === "confirming" ||
    input.providerStatus === "confirmed"
  )
    return "CONFIRMING";
  if (input.providerStatus === "sending") return "PAYMENT_DETECTED";
  if (input.providerStatus === "expired") return "EXPIRED";
  if (input.providerStatus === "failed" || input.providerStatus === "refunded")
    return "FAILED";
  return "INVOICE_PENDING";
}

const STATUS_RANK: Partial<Record<PaymentAttemptStatus, number>> = {
  CREATED: 0,
  INVOICE_PENDING: 1,
  PAYMENT_DETECTED: 2,
  UNDERPAID: 2,
  CONFIRMING: 3,
  OVERPAID: 4,
  SETTLED: 5,
};

export async function applyNowPaymentsEvent(input: {
  providerInvoiceId: string;
  providerEventId: string;
  providerStatus: NowPaymentsStatus;
  receivedSatoshis: bigint | null;
  transactionId: string | null;
  confirmationCount: number | null;
  payloadHash: string;
}) {
  const result = await withTransaction(async (transaction) => {
    const duplicate = await transaction.paymentEvent.findUnique({
      where: { providerEventId: input.providerEventId },
      select: { id: true },
    });
    if (duplicate) return { duplicate: true, settledReference: null };
    const attempt = await transaction.paymentAttempt.findFirst({
      where: {
        provider: "NOWPAYMENTS",
        providerInvoiceId: input.providerInvoiceId,
      },
      select: {
        id: true,
        status: true,
        expectedSatoshis: true,
        receivedSatoshis: true,
        orderId: true,
        order: {
          select: {
            reference: true,
            status: true,
            paymentStatus: true,
            fulfillmentType: true,
            destinationLatitude: true,
            destinationLongitude: true,
            courierProfileIdSnapshot: true,
            courierDistanceMeters: true,
            courierDurationSeconds: true,
          },
        },
        checkoutIntentId: true,
      },
    });
    if (!attempt || attempt.expectedSatoshis === null)
      return { duplicate: false, settledReference: null };
    if (attempt.status === "SETTLED")
      return { duplicate: false, settledReference: null };

    const received = input.receivedSatoshis ?? attempt.receivedSatoshis;
    const candidate = nextBitcoinAttemptStatus({
      providerStatus: input.providerStatus,
      expectedSatoshis: attempt.expectedSatoshis,
      receivedSatoshis: received,
    });
    const currentRank = STATUS_RANK[attempt.status] ?? 0;
    const candidateRank = STATUS_RANK[candidate] ?? currentRank;
    const terminal = ["EXPIRED", "FAILED", "CANCELLED", "OVERPAID"].includes(
      attempt.status,
    );
    const amountMismatch =
      candidate === "UNDERPAID" || candidate === "OVERPAID";
    const nextStatus =
      terminal || (!amountMismatch && candidateRank < currentRank)
        ? attempt.status
        : candidate;
    await transaction.paymentEvent.create({
      data: {
        paymentAttemptId: attempt.id,
        providerEventId: input.providerEventId,
        eventType:
          nextStatus === attempt.status && candidate !== attempt.status
            ? `NOWPAYMENTS_${input.providerStatus.toUpperCase()}_IGNORED`
            : `NOWPAYMENTS_${input.providerStatus.toUpperCase()}`,
        fromStatus: attempt.status,
        toStatus: nextStatus,
        payloadHash: input.payloadHash,
        metadata: { confirmationCount: input.confirmationCount },
      },
    });
    await transaction.paymentAttempt.update({
      where: { id: attempt.id },
      data: {
        status: nextStatus,
        receivedSatoshis: received,
        ...(input.transactionId ? { transactionId: input.transactionId } : {}),
        ...(input.confirmationCount !== null
          ? { confirmationCount: input.confirmationCount }
          : {}),
        ...(["PAYMENT_DETECTED", "UNDERPAID", "CONFIRMING", "SETTLED"].includes(
          nextStatus,
        )
          ? { detectedAt: new Date() }
          : {}),
        ...(nextStatus === "SETTLED" ? { confirmedAt: new Date() } : {}),
        ...(["EXPIRED", "FAILED"].includes(nextStatus)
          ? { failedAt: new Date() }
          : {}),
      },
    });
    if (nextStatus !== "SETTLED" || !attempt.orderId || !attempt.order)
      return { duplicate: false, settledReference: null };

    if (attempt.order.paymentStatus !== "PAID") {
      const deliveryTracking =
        attempt.order.fulfillmentType === "DELIVERY" &&
        attempt.order.destinationLatitude !== null &&
        attempt.order.destinationLongitude !== null &&
        attempt.order.courierProfileIdSnapshot &&
        attempt.order.courierDistanceMeters !== null &&
        attempt.order.courierDurationSeconds !== null
          ? createSelectedCourierSimulation({
              destination: [
                Number(attempt.order.destinationLongitude),
                Number(attempt.order.destinationLatitude),
              ],
              distanceMeters: attempt.order.courierDistanceMeters,
              durationSeconds: attempt.order.courierDurationSeconds,
              seed: `${attempt.order.reference}:${attempt.order.courierProfileIdSnapshot}`,
            })
          : null;
      await transaction.order.update({
        where: { id: attempt.orderId },
        data: {
          status: deliveryTracking ? "OUT_FOR_DELIVERY" : "CONFIRMED",
          paymentStatus: "PAID",
          statusEvents: {
            create: deliveryTracking
              ? [
                  {
                    fromStatus: attempt.order.status,
                    toStatus: "CONFIRMED",
                    note: "Bitcoin deposit settled.",
                  },
                  {
                    fromStatus: "CONFIRMED",
                    toStatus: "OUT_FOR_DELIVERY",
                    note: "Selected courier simulation started automatically.",
                  },
                ]
              : {
                  fromStatus: attempt.order.status,
                  toStatus: "CONFIRMED",
                  note: "Bitcoin deposit settled.",
                },
          },
          paymentStatusEvents: {
            create: {
              fromStatus: attempt.order.paymentStatus,
              toStatus: "PAID",
              note: "The exact Bitcoin deposit was confirmed by NOWPayments.",
            },
          },
        },
      });
      if (deliveryTracking) {
        await transaction.deliveryTracking.upsert({
          where: { orderId: attempt.orderId },
          create: trackingCreateData(attempt.orderId, deliveryTracking),
          update: {},
        });
      }
      await transaction.checkoutIntent.update({
        where: { id: attempt.checkoutIntentId },
        data: { status: "SUBMITTED", submittedAt: new Date() },
      });
      return { duplicate: false, settledReference: attempt.order.reference };
    }
    return { duplicate: false, settledReference: null };
  });
  return result;
}
