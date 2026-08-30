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
        select: { verificationCodeEncrypted: true },
      });
      if (!order)
        throw new VerificationOperationError("NOT_FOUND", "Order not found.");
      if (!order.verificationCodeEncrypted) {
        throw new VerificationOperationError(
          "UNAVAILABLE",
          "No verification code is available for this order.",
        );
      }
      let code: string;
      try {
        code = decryptVerificationCode(order.verificationCodeEncrypted);
      } catch {
        throw new VerificationOperationError(
          "UNAVAILABLE",
          "The verification code could not be decrypted.",
        );
      }
      await transaction.orderVerificationAccessEvent.create({
        data: { orderId: input.orderId, adminUserId: input.adminId },
      });
      return { code };
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
        },
      });
      if (!current)
        throw new VerificationOperationError("NOT_FOUND", "Order not found.");
      if (!current.verificationCodeEncrypted) {
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
        select: { status: true, paymentStatus: true },
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
      return { status: "PENDING" as const, paymentStatus: "UNPAID" as const };
    });
    logger.info("order_verification.rejected", {
      orderId: input.orderId,
      adminId: input.adminId,
    });
    return result;
  }
}
