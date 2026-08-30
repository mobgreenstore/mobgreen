import { describe, expect, it, vi } from "vitest";

const permission = vi.hoisted(() =>
  vi.fn(async () => ({ id: "a70d9361-91cd-4d47-873f-7e5780fa23cc" })),
);
const updateOrderStatus = vi.hoisted(() => vi.fn());
const updatePaymentStatus = vi.hoisted(() => vi.fn());

vi.mock("@/server/auth/authorization", () => ({
  requireAdminPermission: permission,
}));
vi.mock("@/features/orders/server/order-operation-service", () => ({
  AdminOrderOperationService: class {
    updateOrderStatus = updateOrderStatus;
    updatePaymentStatus = updatePaymentStatus;
  },
  OrderOperationError: class OrderOperationError extends Error {},
}));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

const { initialOrderActionState } =
  await import("@/features/orders/server/action-state");
const { updateOrderOperationAction } =
  await import("@/features/orders/server/actions");

function orderForm() {
  const form = new FormData();
  form.set("operation", "order");
  form.set("orderId", "124bf462-6765-451c-8db8-d47976ec9595");
  form.set("toStatus", "PROCESSING");
  form.set("note", "Packed");
  return form;
}

describe("admin order actions", () => {
  it("authorizes writes before invoking the service", async () => {
    updateOrderStatus.mockResolvedValue({ status: "PROCESSING" });
    await updateOrderOperationAction(initialOrderActionState, orderForm());
    expect(permission).toHaveBeenCalledWith("orders.write");
    expect(permission.mock.invocationCallOrder[0]).toBeLessThan(
      updateOrderStatus.mock.invocationCallOrder[0] ?? Infinity,
    );
  });

  it("does not invoke a write when authorization fails", async () => {
    permission.mockRejectedValueOnce(new Error("Unauthorized"));
    await expect(
      updateOrderOperationAction(initialOrderActionState, orderForm()),
    ).rejects.toThrow("Unauthorized");
    expect(updateOrderStatus).not.toHaveBeenCalled();
    expect(updatePaymentStatus).not.toHaveBeenCalled();
  });

  it("rejects non-whitelisted status input", async () => {
    const form = orderForm();
    form.set("toStatus", "DELETE_EVERYTHING");
    await expect(
      updateOrderOperationAction(initialOrderActionState, form),
    ).resolves.toEqual({
      status: "error",
      message: "Choose a valid status update.",
    });
    expect(updateOrderStatus).not.toHaveBeenCalled();
  });
});
