"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { dispatchOrderSubmittedNotification } from "@/features/order-notifications/server/service";
import {
  AdminVerificationService,
  VerificationOperationError,
} from "@/features/orders/server/verification-service";
import { requireAdminPermission } from "@/server/auth/authorization";
import { prisma } from "@/server/db/client";

const orderIdSchema = z.uuid();

export interface VerificationActionState {
  status: "idle" | "success" | "error";
  message?: string;
  code?: string;
}

export const initialVerificationActionState: VerificationActionState = {
  status: "idle",
};

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
    const { code } = await new AdminVerificationService().reveal({
      orderId: parsed.data,
      adminId: admin.id,
    });
    return {
      status: "success",
      message: "Code revealed. This access was recorded.",
      code,
    };
  } catch (error) {
    return failure(error);
  }
}

export async function approveVerificationAction(
  _previous: VerificationActionState,
  formData: FormData,
): Promise<VerificationActionState> {
  const admin = await requireAdminPermission("payments.verify");
  const parsed = parseOrderId(formData);
  if (!parsed.success) return { status: "error", message: "Invalid order." };
  try {
    await new AdminVerificationService().approve({
      orderId: parsed.data,
      adminId: admin.id,
    });
    revalidatePath(`/admin/orders/${parsed.data}`);
    revalidatePath("/admin/orders");
    revalidatePath("/admin");
    return {
      status: "success",
      message: "Verification approved. Payment is paid and order is confirmed.",
    };
  } catch (error) {
    return failure(error);
  }
}

export async function rejectVerificationAction(
  _previous: VerificationActionState,
  formData: FormData,
): Promise<VerificationActionState> {
  const admin = await requireAdminPermission("payments.verify");
  const parsed = parseOrderId(formData);
  if (!parsed.success) return { status: "error", message: "Invalid order." };
  try {
    await new AdminVerificationService().reject({
      orderId: parsed.data,
      adminId: admin.id,
    });
    revalidatePath(`/admin/orders/${parsed.data}`);
    revalidatePath("/admin/orders");
    revalidatePath("/admin");
    return {
      status: "success",
      message: "Verification rejected. Payment is marked unpaid.",
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
  const result = await dispatchOrderSubmittedNotification(order.reference);
  revalidatePath(`/admin/orders/${parsed.data}`);
  return result.status === "SENT"
    ? { status: "success", message: "Administrator email sent." }
    : {
        status: "error",
        message:
          result.status === "NOT_CONFIGURED"
            ? "Mail is not configured."
            : "Email could not be sent. You can retry safely.",
      };
}
