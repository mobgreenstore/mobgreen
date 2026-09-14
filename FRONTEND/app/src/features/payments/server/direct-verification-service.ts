import "server-only";

import { randomBytes, randomUUID } from "node:crypto";
import type {
  Currency,
  PaymentMethod,
  Prisma,
} from "@/generated/prisma/client";
import {
  encryptVerificationCode,
  fingerprintVerificationCode,
} from "@/features/checkout/server/code-encryption";
import { maskVerificationCode } from "@/features/order-notifications/server/template";
import {
  createCustomerOrderNotificationEnvelope,
  createOrderNotificationEnvelope,
} from "@/features/order-notifications/server/service";
import type { GuestSessionIdentity } from "@/server/guest-session";
import { withTransaction } from "@/server/db/transaction";

const INTENT_TTL_MS = 30 * 60 * 1000;

function createReference() {
  const year = new Date().getUTCFullYear();
  return `MG-${year}-${randomBytes(7).toString("hex").toUpperCase()}`;
}

export interface DirectVerificationInput {
  customerName: string;
  customerEmail: string;
  orderAmountMinor: bigint;
  currency: Currency;
  paymentMethod: PaymentMethod;
  rechargePartner: string | null;
  verificationCodes: string[];
}

export async function createDirectVerificationOrder(
  input: DirectVerificationInput,
  guest: GuestSessionIdentity,
) {
  const securedCodes = input.verificationCodes.map((code, position) => ({
    encryptedValue: encryptVerificationCode(code),
    fingerprint: fingerprintVerificationCode(code),
    maskedValue: maskVerificationCode(code),
    position,
  }));
  const encryptedCode = securedCodes[0]?.encryptedValue ?? null;
  const adminNotification = createOrderNotificationEnvelope();
  const customerNotification = createCustomerOrderNotificationEnvelope(
    input.customerEmail,
  );
  const notifications = [
    ...(adminNotification ? [adminNotification] : []),
    ...(customerNotification ? [customerNotification] : []),
  ];

  return withTransaction(async (transaction) => {
    const guestSession = await transaction.guestSession.upsert({
      where: { tokenHash: guest.tokenHash },
      create: { tokenHash: guest.tokenHash, expiresAt: guest.expiresAt },
      update: { expiresAt: guest.expiresAt, lastSeenAt: new Date() },
      select: { id: true },
    });

    const idempotencyKey = randomUUID();
    const intentPublicId = randomBytes(24).toString("base64url");
    const expiresAt = new Date(Date.now() + INTENT_TTL_MS);

    const intent = await transaction.checkoutIntent.create({
      data: {
        publicId: intentPublicId,
        guestSessionId: guestSession.id,
        idempotencyKey,
        status: "SUBMITTED",
        submittedAt: new Date(),
        customerName: input.customerName,
        customerEmail: input.customerEmail,
        fulfillmentType: "PICKUP",
        paymentMethod: input.paymentMethod,
        rechargeProvider: input.rechargePartner,
        cartLines: [] as Prisma.InputJsonValue,
        currency: input.currency,
        subtotalMinor: input.orderAmountMinor,
        expiresAt,
      },
      select: { id: true },
    });

    const order = await transaction.order.create({
      data: {
        reference: createReference(),
        idempotencyKey,
        guestSessionId: guestSession.id,
        checkoutIntentId: intent.id,
        customerName: input.customerName,
        customerEmail: input.customerEmail,
        fulfillmentType: "PICKUP",
        paymentMethod: input.paymentMethod,
        rechargeProvider: input.rechargePartner,
        currency: input.currency,
        subtotalMinor: input.orderAmountMinor,
        totalMinor: input.orderAmountMinor,
        status: "PENDING",
        paymentStatus: "PENDING",
        verificationCodeEncrypted: encryptedCode,
        statusEvents: {
          create: {
            toStatus: "PENDING",
            note: "Direct verification order submitted; awaiting administrator review.",
          },
        },
        paymentStatusEvents: {
          create: {
            toStatus: "PENDING",
            note: "Recharge codes submitted for verification.",
          },
        },
        ...(notifications.length
          ? { notifications: { create: notifications } }
          : {}),
      },
      select: {
        id: true,
        reference: true,
        customerName: true,
        customerEmail: true,
        currency: true,
        totalMinor: true,
        paymentMethod: true,
        paymentStatus: true,
        rechargeProvider: true,
      },
    });

    await transaction.paymentAttempt.create({
      data: {
        publicId: randomBytes(24).toString("base64url"),
        checkoutIntentId: intent.id,
        orderId: order.id,
        paymentMethod: input.paymentMethod,
        provider: "INTERNAL_RECHARGE",
        currency: input.currency,
        orderTotalMinor: input.orderAmountMinor,
        depositMinor: input.orderAmountMinor,
        cashBalanceDueMinor: 0n,
        status: "PENDING_REVIEW",
        rechargeCodes: { create: securedCodes },
        events: {
          create: {
            eventType: "RECHARGE_SUBMITTED",
            toStatus: "PENDING_REVIEW",
            metadata: {
              codeCount: securedCodes.length,
              source: "direct_verification",
            },
          },
        },
      },
    });

    return order;
  });
}
