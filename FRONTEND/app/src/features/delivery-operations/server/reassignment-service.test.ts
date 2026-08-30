import { beforeEach, describe, expect, it, vi } from "vitest";

const transaction = vi.hoisted(() => ({
  order: { findUnique: vi.fn(), update: vi.fn() },
  checkoutIntent: { update: vi.fn() },
  orderStatusEvent: { create: vi.fn() },
}));
const withTransaction = vi.hoisted(() =>
  vi.fn(async (operation: (database: typeof transaction) => unknown) =>
    operation(transaction),
  ),
);
const info = vi.hoisted(() => vi.fn());

vi.mock("server-only", () => ({}));
vi.mock("@/server/db/transaction", () => ({ withTransaction }));
vi.mock("@/server/core/logger", () => ({
  logger: { info, warn: vi.fn(), error: vi.fn() },
}));

import { AdminCourierReassignmentService } from "@/features/delivery-operations/server/reassignment-service";

const candidateSet = [
  {
    candidateId: "candidate_mx_97_secure_01",
    profileId: "courier-mx-97",
    displayName: "Maxime97",
    distanceMeters: 1_250,
    estimatedDurationSeconds: 1_100,
  },
  {
    candidateId: "candidate_so_508_secure_02",
    profileId: "courier-so-508",
    displayName: "Sofia508",
    distanceMeters: 1_900,
    estimatedDurationSeconds: 1_400,
  },
];

describe("admin courier reassignment", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    transaction.order.findUnique.mockResolvedValue({
      id: "124bf462-6765-451c-8db8-d47976ec9595",
      status: "PROCESSING",
      fulfillmentType: "DELIVERY",
      courierNameSnapshot: "Maxime97",
      checkoutIntent: { id: "intent-id", candidateSet },
    });
  });

  it("updates both snapshots and writes an administrator audit event", async () => {
    const result = await new AdminCourierReassignmentService().reassign({
      orderId: "124bf462-6765-451c-8db8-d47976ec9595",
      candidateId: "candidate_so_508_secure_02",
      adminId: "a70d9361-91cd-4d47-873f-7e5780fa23cc",
    });
    expect(result).toEqual(candidateSet[1]);
    expect(transaction.order.update).toHaveBeenCalledWith({
      where: { id: "124bf462-6765-451c-8db8-d47976ec9595" },
      data: {
        courierProfileIdSnapshot: "courier-so-508",
        courierNameSnapshot: "Sofia508",
        courierDistanceMeters: 1_900,
        courierDurationSeconds: 1_400,
      },
    });
    expect(transaction.checkoutIntent.update).toHaveBeenCalledOnce();
    expect(transaction.orderStatusEvent.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        fromStatus: "PROCESSING",
        toStatus: "PROCESSING",
        changedByAdminId: "a70d9361-91cd-4d47-873f-7e5780fa23cc",
        note: expect.stringContaining("Maxime97 to Sofia508"),
      }),
    });
    expect(info).toHaveBeenCalledWith(
      "delivery.courier_reassigned",
      expect.objectContaining({ candidateId: "candidate_so_508_secure_02" }),
    );
  });

  it("rejects a profile forged outside the persisted candidate set", async () => {
    await expect(
      new AdminCourierReassignmentService().reassign({
        orderId: "124bf462-6765-451c-8db8-d47976ec9595",
        candidateId: "candidate_forged_secure_03",
        adminId: "a70d9361-91cd-4d47-873f-7e5780fa23cc",
      }),
    ).rejects.toMatchObject({ code: "CANDIDATE_UNAVAILABLE" });
    expect(transaction.order.update).not.toHaveBeenCalled();
  });

  it("locks assignment after dispatch", async () => {
    transaction.order.findUnique.mockResolvedValue({
      id: "124bf462-6765-451c-8db8-d47976ec9595",
      status: "OUT_FOR_DELIVERY",
      fulfillmentType: "DELIVERY",
      courierNameSnapshot: "Maxime97",
      checkoutIntent: { id: "intent-id", candidateSet },
    });
    await expect(
      new AdminCourierReassignmentService().reassign({
        orderId: "124bf462-6765-451c-8db8-d47976ec9595",
        candidateId: "candidate_so_508_secure_02",
        adminId: "a70d9361-91cd-4d47-873f-7e5780fa23cc",
      }),
    ).rejects.toMatchObject({ code: "ASSIGNMENT_LOCKED" });
    expect(transaction.order.update).not.toHaveBeenCalled();
  });
});
