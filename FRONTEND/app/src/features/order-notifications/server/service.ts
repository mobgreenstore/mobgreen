import "server-only";

import { decryptVerificationCode } from "@/features/checkout/server/code-encryption";
import {
  buildAdminOrderEmail,
  maskVerificationCode,
} from "@/features/order-notifications/server/template";
import { prisma } from "@/server/db/client";
import { logger } from "@/server/core/logger";
import {
  getMailEnvironment,
  mailEnvironmentConfigured,
} from "@/server/mail/environment";
import { getMailTransport } from "@/server/mail/transport";

const STALE_PROCESSING_MS = 5 * 60 * 1000;

function safeError(error: unknown) {
  return error instanceof Error
    ? error.message.slice(0, 500)
    : "Mail provider rejected the notification.";
}

export function createOrderNotificationEnvelope() {
  if (!mailEnvironmentConfigured()) return null;
  try {
    const environment = getMailEnvironment();
    return {
      kind: "ADMIN_ORDER_SUBMITTED" as const,
      recipient: environment.ORDER_NOTIFICATION_TO,
      sender: environment.ORDER_NOTIFICATION_FROM,
    };
  } catch (error) {
    logger.error("order_notification.environment_invalid", { error });
    return null;
  }
}

export async function dispatchOrderSubmittedNotification(reference: string) {
  const environment = createOrderNotificationEnvelope();
  if (!environment) return { status: "NOT_CONFIGURED" as const };

  const order = await prisma.order.findUnique({
    where: { reference },
    select: {
      id: true,
      reference: true,
      customerName: true,
      customerEmail: true,
      customerPhone: true,
      fulfillmentType: true,
      paymentMethod: true,
      rechargeProvider: true,
      deliveryAddress: true,
      courierNameSnapshot: true,
      currency: true,
      totalMinor: true,
      createdAt: true,
      verificationCodeEncrypted: true,
      items: {
        orderBy: { createdAt: "asc" },
        select: {
          productNameSnapshot: true,
          weightValueSnapshot: true,
          weightUnitSnapshot: true,
          quantity: true,
          lineTotalMinor: true,
        },
      },
      notifications: {
        where: {
          kind: environment.kind,
          recipient: environment.recipient,
        },
        take: 1,
      },
    },
  });
  if (!order) return { status: "NOT_FOUND" as const };

  const notification =
    order.notifications[0] ??
    (await prisma.orderNotification.upsert({
      where: {
        orderId_kind_recipient: {
          orderId: order.id,
          kind: environment.kind,
          recipient: environment.recipient,
        },
      },
      create: { orderId: order.id, ...environment },
      update: {},
    }));
  if (notification.status === "SENT") return { status: "SENT" as const };

  const staleBefore = new Date(Date.now() - STALE_PROCESSING_MS);
  const claimed = await prisma.orderNotification.updateMany({
    where: {
      id: notification.id,
      OR: [
        { status: { in: ["PENDING", "FAILED"] } },
        { status: "PROCESSING", lastAttemptAt: { lt: staleBefore } },
      ],
    },
    data: {
      status: "PROCESSING",
      attemptCount: { increment: 1 },
      lastAttemptAt: new Date(),
      lastError: null,
    },
  });
  if (claimed.count !== 1) return { status: "PROCESSING" as const };

  try {
    let code = "";
    if (order.verificationCodeEncrypted) {
      try {
        code = decryptVerificationCode(order.verificationCodeEncrypted);
      } catch {
        code = "";
      }
    }
    const appUrl = (
      process.env.ADMIN_APP_URL ?? "http://localhost:3000"
    ).replace(/\/$/, "");
    const email = buildAdminOrderEmail({
      adminOrderUrl: `${appUrl}/admin/orders/${order.id}`,
      reference: order.reference,
      customerName: order.customerName,
      customerEmail: order.customerEmail,
      customerPhone: order.customerPhone,
      fulfillment: order.fulfillmentType,
      paymentMethod: order.paymentMethod,
      rechargeProvider: order.rechargeProvider,
      deliveryAddress: order.deliveryAddress,
      courierName: order.courierNameSnapshot,
      currency: order.currency,
      totalMinor: Number(order.totalMinor),
      createdAt: order.createdAt,
      maskedVerificationCode: maskVerificationCode(code),
      items: order.items.map((item) => ({
        name: item.productNameSnapshot,
        weightValue: Number(item.weightValueSnapshot),
        weightUnit: item.weightUnitSnapshot,
        quantity: item.quantity,
        lineTotalMinor: Number(item.lineTotalMinor),
      })),
    });
    const info = await getMailTransport().sendMail({
      from: environment.sender,
      to: environment.recipient,
      ...email,
    });
    await prisma.orderNotification.update({
      where: { id: notification.id },
      data: {
        status: "SENT",
        providerMessageId: info.messageId.slice(0, 255),
        sentAt: new Date(),
        lastError: null,
      },
    });
    logger.info("order_notification.sent", {
      orderId: order.id,
      notificationId: notification.id,
    });
    return { status: "SENT" as const };
  } catch (error) {
    await prisma.orderNotification.updateMany({
      where: { id: notification.id, status: "PROCESSING" },
      data: { status: "FAILED", lastError: safeError(error) },
    });
    logger.error("order_notification.failed", {
      orderId: order.id,
      notificationId: notification.id,
      error,
    });
    return { status: "FAILED" as const };
  }
}
