import { describe, expect, it, vi } from "vitest";

const permission = vi.hoisted(() =>
  vi.fn(async () => ({ id: "a70d9361-91cd-4d47-873f-7e5780fa23cc" })),
);
const reassign = vi.hoisted(() => vi.fn());

vi.mock("@/server/auth/authorization", () => ({
  requireAdminPermission: permission,
}));
vi.mock("@/features/delivery-operations/server/reassignment-service", () => ({
  AdminCourierReassignmentService: class {
    reassign = reassign;
  },
  CourierReassignmentError: class CourierReassignmentError extends Error {},
}));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

const { initialCourierAssignmentActionState } =
  await import("@/features/delivery-operations/server/action-state");
const { reassignCourierAction } =
  await import("@/features/delivery-operations/server/actions");

function form() {
  const value = new FormData();
  value.set("orderId", "124bf462-6765-451c-8db8-d47976ec9595");
  value.set("candidateId", "candidate_so_508_secure_02");
  return value;
}

describe("courier reassignment action", () => {
  it("authorizes order writes before reassignment", async () => {
    reassign.mockResolvedValue({});
    await reassignCourierAction(initialCourierAssignmentActionState, form());
    expect(permission).toHaveBeenCalledWith("orders.write");
    expect(permission.mock.invocationCallOrder[0]).toBeLessThan(
      reassign.mock.invocationCallOrder[0] ?? Infinity,
    );
  });

  it("does not invoke the service when authorization fails", async () => {
    permission.mockRejectedValueOnce(new Error("Unauthorized"));
    await expect(
      reassignCourierAction(initialCourierAssignmentActionState, form()),
    ).rejects.toThrow("Unauthorized");
    expect(reassign).not.toHaveBeenCalled();
  });
});
