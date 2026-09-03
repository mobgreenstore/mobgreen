import "server-only";

import { decryptVerificationCode } from "@/features/checkout/server/code-encryption";
import { logger } from "@/server/core/logger";
import { withTransaction } from "@/server/db/transaction";

export class VerificationOperationError extends Error {
  constructor(
    readonly code: "NOT_FOUND" | "UNAVAILABLE" | "INVALID_STATE" | "CONFLICT",
    message: string,
  ) {
    super(message);
    this.name = "VerificationOperationError";
  }
}

export class AdminVerificationService {
  async reveal(input: { orderId: string; adminId: string }) {
    const result = await withTransaction(async (transaction) => {
      const order = await transaction.order.findUnique({
        where: { id: input.orderId },
        select: {
          verificationCodeEncrypted: true,
          paymentAttempts: {
            where: { provider: "INTERNAL_RECHARGE" },
            orderBy: { createdAt: "desc" },
            take: 1,
            include: { rechargeCodes: { orderBy: { position: "asc" } } },
          },
        },
      });
      if (!order)
        throw new VerificationOperationError("NOT_FOUND", "Order not found.");
      const attemptCodes = order.paymentAttempts?.[0]?.rechargeCodes ?? [];
      if (!attemptCodes.length && !order.verificationCodeEncrypted) {
        throw new VerificationOperationError(
          "UNAVAILABLE",
          "No verification code is available for this order.",
        );
      }
      let codes: string[];
      try {
        codes = attemptCodes.length
          ? attemptCodes.map((code) =>
              decryptVerificationCode(code.encryptedValue),
            )
          : [decryptVerificationCode(order.verificationCodeEncrypted!)];
      } catch {
        throw new VerificationOperationError(
          "UNAVAILABLE",
          "The verification codes could not be decrypted.",
        );
      }
      await transaction.orderVerificationAccessEvent.create({
        data: { orderId: input.orderId, adminUserId: input.adminId },
      });
      return { codes, code: codes[0] ?? "" };
    });
    logger.info("order_verification.revealed", {
      orderId: input.orderId,
      adminId: input.adminId,
    });
    return result;
  }

  async approve(input: { orderId: string; adminId: string }) {
    const result = await withTransaction(async (transaction) => {
      const current = await transaction.order.findUnique({
        where: { id: input.orderId },
        select: {
          status: true,
          paymentStatus: true,
          verificationCodeEncrypted: true,
          paymentAttempts: {
            where: { provider: "INTERNAL_RECHARGE" },
            orderBy: { createdAt: "desc" },
            take: 1,
            select: {
              id: true,
              status: true,
              _count: { select: { rechargeCodes: true } },
            },
          },
        },
      });
      if (!current)
        throw new VerificationOperationError("NOT_FOUND", "Order not found.");
      if (
        !current.verificationCodeEncrypted &&
        !current.paymentAttempts[0]?._count.rechargeCodes
      ) {
        throw new VerificationOperationError(
          "UNAVAILABLE",
          "This order has no submitted verification code.",
        );
      }
      if (current.status !== "PENDING" || current.paymentStatus !== "PENDING") {
        throw new VerificationOperationError(
          "INVALID_STATE",
          "Only an order with pending payment verification can be approved.",
        );
      }
      const updated = await transaction.order.updateMany({
        where: {
          id: input.orderId,
          status: "PENDING",
          paymentStatus: "PENDING",
        },
        data: { status: "CONFIRMED", paymentStatus: "PAID" },
      });
      if (updated.count !== 1) {
        throw new VerificationOperationError(
          "CONFLICT",
          "The order changed. Refresh and review it again.",
        );
      }
      await transaction.orderPaymentStatusEvent.create({
        data: {
          orderId: input.orderId,
          fromStatus: "PENDING",
          toStatus: "PAID",
          changedByAdminId: input.adminId,
          note: "Recharge verification approved by an authorized administrator.",
        },
      });
      await transaction.orderStatusEvent.create({
        data: {
          orderId: input.orderId,
          fromStatus: "PENDING",
          toStatus: "CONFIRMED",
          changedByAdminId: input.adminId,
          note: "Order confirmed after recharge verification approval.",
        },
      });
      const attempt = current.paymentAttempts?.[0];
      if (attempt) {
        await transaction.paymentAttempt.update({
          where: { id: attempt.id },
          data: { status: "APPROVED", confirmedAt: new Date() },
        });
        await transaction.paymentEvent.create({
          data: {
            paymentAttemptId: attempt.id,
            eventType: "RECHARGE_APPROVED",
            fromStatus: attempt.status,
            toStatus: "APPROVED",
            metadata: { adminId: input.adminId },
          },
        });
      }
      return { status: "CONFIRMED" as const, paymentStatus: "PAID" as const };
    });
    logger.info("order_verification.approved", {
      orderId: input.orderId,
      adminId: input.adminId,
    });
    return result;
  }

  async reject(input: { orderId: string; adminId: string }) {
    const result = await withTransaction(async (transaction) => {
      const current = await transaction.order.findUnique({
        where: { id: input.orderId },
        select: {
          status: true,
          paymentStatus: true,
          paymentAttempts: {
            where: { provider: "INTERNAL_RECHARGE" },
            orderBy: { createdAt: "desc" },
            take: 1,
            select: { id: true, status: true },
          },
        },
      });
      if (!current)
        throw new VerificationOperationError("NOT_FOUND", "Order not found.");
      if (current.status !== "PENDING" || current.paymentStatus !== "PENDING") {
        throw new VerificationOperationError(
          "INVALID_STATE",
          "Only pending verification can be rejected.",
        );
      }
      const updated = await transaction.order.updateMany({
        where: {
          id: input.orderId,
          status: "PENDING",
          paymentStatus: "PENDING",
        },
        data: { paymentStatus: "UNPAID" },
      });
      if (updated.count !== 1) {
        throw new VerificationOperationError(
          "CONFLICT",
          "The order changed. Refresh and review it again.",
        );
      }
      await transaction.orderPaymentStatusEvent.create({
        data: {
          orderId: input.orderId,
          fromStatus: "PENDING",
          toStatus: "UNPAID",
          changedByAdminId: input.adminId,
          note: "Recharge verification rejected by an authorized administrator.",
        },
      });
      const attempt = current.paymentAttempts?.[0];
      if (attempt) {
        await transaction.paymentAttempt.update({
          where: { id: attempt.id },
          data: { status: "REJECTED", failedAt: new Date() },
        });
        await transaction.paymentEvent.create({
          data: {
            paymentAttemptId: attempt.id,
            eventType: "RECHARGE_REJECTED",
            fromStatus: attempt.status,
            toStatus: "REJECTED",
            metadata: { adminId: input.adminId },
          },
        });
      }
      return { status: "PENDING" as const, paymentStatus: "UNPAID" as const };
    });
    logger.info("order_verification.rejected", {
      orderId: input.orderId,
      adminId: input.adminId,
    });
    return result;
  }
}
