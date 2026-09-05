"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import {
  dispatchCustomerOrderSubmittedNotification,
  dispatchOrderSubmittedNotification,
} from "@/features/order-notifications/server/service";
import {
  AdminVerificationService,
  VerificationOperationError,
} from "@/features/orders/server/verification-service";
import type { VerificationActionState } from "@/features/orders/verification-action-state";
import { requireAdminPermission } from "@/server/auth/authorization";
import { prisma } from "@/server/db/client";

const orderIdSchema = z.uuid();

function parseOrderId(formData: FormData) {
  return orderIdSchema.safeParse(formData.get("orderId"));
}

function failure(error: unknown): VerificationActionState {
  return {
    status: "error",
    message:
      error instanceof VerificationOperationError
        ? error.message
        : "The verification operation failed. Refresh and try again.",
  };
}

export async function revealVerificationCodeAction(
  _previous: VerificationActionState,
  formData: FormData,
): Promise<VerificationActionState> {
  const admin = await requireAdminPermission("payments.verify");
  const parsed = parseOrderId(formData);
  if (!parsed.success) return { status: "error", message: "Invalid order." };
  try {
    const { codes } = await new AdminVerificationService().reveal({
      orderId: parsed.data,
      adminId: admin.id,
    });
    return {
      status: "success",
      message: "Code revealed. This access was recorded.",
      codes,
    };
  } catch (error) {
    return failure(error);
  }
}

export async function retryOrderNotificationAction(
  _previous: VerificationActionState,
  formData: FormData,
): Promise<VerificationActionState> {
  await requireAdminPermission("payments.verify");
  const parsed = parseOrderId(formData);
  if (!parsed.success) return { status: "error", message: "Invalid order." };
  const order = await prisma.order.findUnique({
    where: { id: parsed.data },
    select: { reference: true },
  });
  if (!order) return { status: "error", message: "Order not found." };
  const [adminResult, customerResult] = await Promise.all([
    dispatchOrderSubmittedNotification(order.reference),
    dispatchCustomerOrderSubmittedNotification(order.reference),
  ]);
  revalidatePath(`/admin/orders/${parsed.data}`);
  return adminResult.status === "SENT" &&
    ["SENT", "NOT_CONFIGURED"].includes(customerResult.status)
    ? {
        status: "success",
        message:
          customerResult.status === "SENT"
            ? "Administrator and customer emails sent."
            : "Administrator email sent.",
      }
    : {
        status: "error",
        message:
          adminResult.status === "NOT_CONFIGURED"
            ? "Mail is not configured."
            : "One or more emails could not be sent. You can retry safely.",
      };
}
