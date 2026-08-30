import { beforeEach, describe, expect, it, vi } from "vitest";

const prisma = vi.hoisted(() => ({
  order: { findUnique: vi.fn() },
  orderNotification: {
    upsert: vi.fn(),
    updateMany: vi.fn(),
    update: vi.fn(),
  },
}));
const sendMail = vi.hoisted(() => vi.fn());

vi.mock("@/server/db/client", () => ({ prisma }));
vi.mock("@/server/mail/environment", () => ({
  mailEnvironmentConfigured: () => true,
  getMailEnvironment: () => ({
    SMTP_HOST: "smtp.gmail.com",
    SMTP_PORT: 465,
    SMTP_SECURE: true,
    SMTP_USER: "mobgreenstore@gmail.com",
    SMTP_APP_PASSWORD: "redacted-test-value",
    ORDER_NOTIFICATION_TO: "mobgreenstore@gmail.com",
    ORDER_NOTIFICATION_FROM: "mobgreenstore@gmail.com",
  }),
}));
vi.mock("@/server/mail/transport", () => ({
  getMailTransport: () => ({ sendMail }),
}));
vi.mock("@/features/checkout/server/code-encryption", () => ({
  decryptVerificationCode: () => "123456789012",
}));
vi.mock("@/server/core/logger", () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));

import { dispatchOrderSubmittedNotification } from "@/features/order-notifications/server/service";

const notification = {
  id: "notification-id",
  status: "PENDING",
  attemptCount: 0,
  sentAt: null,
};
const order = {
  id: "order-id",
  reference: "MG-2026-TEST",
  customerName: "Customer",
  customerEmail: "customer@example.com",
  customerPhone: null,
  fulfillmentType: "PICKUP",
  paymentMethod: "RECHARGE_ONLINE",
  rechargeProvider: "Dundle",
  deliveryAddress: null,
  courierNameSnapshot: null,
  currency: "EUR",
  totalMinor: 10_000n,
  createdAt: new Date("2026-08-29T18:00:00.000Z"),
  verificationCodeEncrypted: "encrypted",
  items: [
    {
      productNameSnapshot: "Product",
      weightValueSnapshot: 100,
      weightUnitSnapshot: "G",
      quantity: 1,
      lineTotalMinor: 10_000n,
    },
  ],
  notifications: [notification],
};

describe("order notification outbox", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    prisma.order.findUnique.mockResolvedValue(order);
    prisma.orderNotification.updateMany.mockResolvedValue({ count: 1 });
    prisma.orderNotification.update.mockResolvedValue({});
    sendMail.mockResolvedValue({ messageId: "gmail-message-id" });
  });

  it("does not send an already delivered notification twice", async () => {
    prisma.order.findUnique.mockResolvedValue({
      ...order,
      notifications: [{ ...notification, status: "SENT" }],
    });
    await expect(
      dispatchOrderSubmittedNotification(order.reference),
    ).resolves.toEqual({ status: "SENT" });
    expect(sendMail).not.toHaveBeenCalled();
  });

  it("claims, sends, and marks a pending notification sent", async () => {
    await expect(
      dispatchOrderSubmittedNotification(order.reference),
    ).resolves.toEqual({ status: "SENT" });
    expect(sendMail).toHaveBeenCalledOnce();
    expect(prisma.orderNotification.update).toHaveBeenCalledWith({
      where: { id: notification.id },
      data: expect.objectContaining({
        status: "SENT",
        providerMessageId: "gmail-message-id",
        sentAt: expect.any(Date),
      }),
    });
  });

  it("records provider failure without throwing into checkout", async () => {
    sendMail.mockRejectedValue(new Error("provider unavailable"));
    await expect(
      dispatchOrderSubmittedNotification(order.reference),
    ).resolves.toEqual({ status: "FAILED" });
    expect(prisma.orderNotification.updateMany).toHaveBeenLastCalledWith({
      where: { id: notification.id, status: "PROCESSING" },
      data: { status: "FAILED", lastError: "provider unavailable" },
    });
  });
});
