"use server";

import { revalidatePath } from "next/cache";
import type { OrderActionState } from "@/features/orders/server/action-state";
import { z } from "zod";
import { ORDER_STATUSES, PAYMENT_STATUSES } from "@/features/orders/types";
import {
  AdminOrderOperationService,
  OrderOperationError,
} from "@/features/orders/server/order-operation-service";
import { requireAdminPermission } from "@/server/auth/authorization";

const actionSchema = z.discriminatedUnion("operation", [
  z.object({
    operation: z.literal("order"),
    orderId: z.uuid(),
    toStatus: z.enum(ORDER_STATUSES),
    note: z.string().trim().max(1000).optional(),
  }),
  z.object({
    operation: z.literal("payment"),
    orderId: z.uuid(),
    toStatus: z.enum(PAYMENT_STATUSES),
    note: z.string().trim().max(1000).optional(),
  }),
  z.object({
    operation: z.literal("tracking"),
    orderId: z.uuid(),
    note: z.string().trim().max(1000).optional(),
  }),
]);

export async function updateOrderOperationAction(
  _previous: OrderActionState,
  formData: FormData,
): Promise<OrderActionState> {
  const admin = await requireAdminPermission("orders.write");
  const parsed = actionSchema.safeParse({
    operation: formData.get("operation"),
    orderId: formData.get("orderId"),
    toStatus: formData.get("toStatus"),
    note: formData.get("note"),
  });
  if (!parsed.success) {
    return { status: "error", message: "Choose a valid status update." };
  }

  try {
    const service = new AdminOrderOperationService();
    if (parsed.data.operation === "order") {
      await service.updateOrderStatus({
        orderId: parsed.data.orderId,
        toStatus: parsed.data.toStatus,
        adminId: admin.id,
        ...(parsed.data.note ? { note: parsed.data.note } : {}),
      });
    } else if (parsed.data.operation === "payment") {
      await service.updatePaymentStatus({
        orderId: parsed.data.orderId,
        toStatus: parsed.data.toStatus,
        adminId: admin.id,
        ...(parsed.data.note ? { note: parsed.data.note } : {}),
      });
    } else {
      await service.regenerateTracking({
        orderId: parsed.data.orderId,
        adminId: admin.id,
        ...(parsed.data.note ? { note: parsed.data.note } : {}),
      });
    }
    revalidatePath(`/admin/orders/${parsed.data.orderId}`);
    revalidatePath("/admin/orders");
    return {
      status: "success",
      message:
        parsed.data.operation === "order"
          ? "Order status updated."
          : parsed.data.operation === "payment"
            ? "Payment status updated."
            : "Delivery route regenerated.",
    };
  } catch (error) {
    if (error instanceof OrderOperationError) {
      return { status: "error", message: error.message };
    }
    return {
      status: "error",
      message: "The order could not be updated. Refresh and try again.",
    };
  }
}
