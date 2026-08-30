import { beforeEach, describe, expect, it, vi } from "vitest";

const transaction = vi.hoisted(() => ({
  order: { findUnique: vi.fn(), updateMany: vi.fn() },
  orderVerificationAccessEvent: { create: vi.fn() },
  orderPaymentStatusEvent: { create: vi.fn() },
  orderStatusEvent: { create: vi.fn() },
}));
const withTransaction = vi.hoisted(() =>
  vi.fn(async (operation: (database: typeof transaction) => unknown) =>
    operation(transaction),
  ),
);
const decryptVerificationCode = vi.hoisted(() => vi.fn(() => "123456789012"));

vi.mock("@/server/db/transaction", () => ({ withTransaction }));
vi.mock("@/features/checkout/server/code-encryption", () => ({
  decryptVerificationCode,
}));
vi.mock("@/server/core/logger", () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));

import { AdminVerificationService } from "@/features/orders/server/verification-service";

const input = {
  orderId: "124bf462-6765-451c-8db8-d47976ec9595",
  adminId: "a70d9361-91cd-4d47-873f-7e5780fa23cc",
};

describe("admin verification service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    transaction.order.updateMany.mockResolvedValue({ count: 1 });
    transaction.orderVerificationAccessEvent.create.mockResolvedValue({});
    transaction.orderPaymentStatusEvent.create.mockResolvedValue({});
    transaction.orderStatusEvent.create.mockResolvedValue({});
  });

  it("decrypts only during explicit reveal and records an audit event", async () => {
    transaction.order.findUnique.mockResolvedValue({
      verificationCodeEncrypted: "encrypted",
    });
    await expect(new AdminVerificationService().reveal(input)).resolves.toEqual(
      {
        code: "123456789012",
      },
    );
    expect(
      transaction.orderVerificationAccessEvent.create,
    ).toHaveBeenCalledWith({
      data: { orderId: input.orderId, adminUserId: input.adminId },
    });
  });

  it("atomically makes payment paid and confirms rather than completes the order", async () => {
    transaction.order.findUnique.mockResolvedValue({
      status: "PENDING",
      paymentStatus: "PENDING",
      verificationCodeEncrypted: "encrypted",
    });
    await expect(
      new AdminVerificationService().approve(input),
    ).resolves.toEqual({
      status: "CONFIRMED",
      paymentStatus: "PAID",
    });
    expect(transaction.order.updateMany).toHaveBeenCalledWith({
      where: {
        id: input.orderId,
        status: "PENDING",
        paymentStatus: "PENDING",
      },
      data: { status: "CONFIRMED", paymentStatus: "PAID" },
    });
    expect(transaction.orderStatusEvent.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ toStatus: "CONFIRMED" }),
    });
  });

  it("rejects stale approval without writing audit status events", async () => {
    transaction.order.findUnique.mockResolvedValue({
      status: "CONFIRMED",
      paymentStatus: "PAID",
      verificationCodeEncrypted: "encrypted",
    });
    await expect(
      new AdminVerificationService().approve(input),
    ).rejects.toMatchObject({
      code: "INVALID_STATE",
    });
    expect(transaction.order.updateMany).not.toHaveBeenCalled();
    expect(transaction.orderStatusEvent.create).not.toHaveBeenCalled();
  });
});
