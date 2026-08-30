"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import type { CourierAssignmentActionState } from "@/features/delivery-operations/server/action-state";
import {
  AdminCourierReassignmentService,
  CourierReassignmentError,
} from "@/features/delivery-operations/server/reassignment-service";
import { requireAdminPermission } from "@/server/auth/authorization";

const reassignSchema = z.object({
  orderId: z.uuid(),
  candidateId: z
    .string()
    .trim()
    .min(20)
    .max(64)
    .regex(new RegExp("^[A-Za-z0-9_-]+$")),
});

export async function reassignCourierAction(
  _previous: CourierAssignmentActionState,
  formData: FormData,
): Promise<CourierAssignmentActionState> {
  const admin = await requireAdminPermission("orders.write");
  const parsed = reassignSchema.safeParse({
    orderId: formData.get("orderId"),
    candidateId: formData.get("candidateId"),
  });
  if (!parsed.success) {
    return { status: "error", message: "Choose a valid courier candidate." };
  }
  try {
    await new AdminCourierReassignmentService().reassign({
      ...parsed.data,
      adminId: admin.id,
    });
    revalidatePath(`/admin/orders/${parsed.data.orderId}`);
    revalidatePath("/admin/orders");
    revalidatePath("/admin/deliveries");
    return { status: "success", message: "Courier assignment updated." };
  } catch (error) {
    if (error instanceof CourierReassignmentError) {
      return { status: "error", message: error.message };
    }
    return {
      status: "error",
      message: "The courier assignment could not be updated. Try again.",
    };
  }
}
