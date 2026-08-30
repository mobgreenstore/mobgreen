import { beforeEach, describe, expect, it, vi } from "vitest";

const transaction = vi.hoisted(() => ({
  order: {
    findUnique: vi.fn(),
    updateMany: vi.fn(),
  },
  orderStatusEvent: { create: vi.fn() },
  orderPaymentStatusEvent: { create: vi.fn() },
  storeSettings: { findUnique: vi.fn() },
  deliveryTracking: { upsert: vi.fn(), updateMany: vi.fn() },
}));
const prepareDeliveryTracking = vi.hoisted(() => vi.fn());
const withTransaction = vi.hoisted(() =>
  vi.fn(async (operation: (database: typeof transaction) => unknown) =>
    operation(transaction),
  ),
);

vi.mock("@/server/db/transaction", () => ({ withTransaction }));
vi.mock("@/features/tracking/server/service", () => ({
  prepareDeliveryTracking,
  DeliveryTrackingError: class DeliveryTrackingError extends Error {
    code = "MISSING_ORIGIN";
  },
  trackingCreateData: (orderId: string, plan: unknown) => ({ orderId, plan }),
  trackingUpdateData: (plan: unknown) => ({ plan }),
}));

import {
  AdminOrderOperationService,
  validOrderTransitions,
} from "@/features/orders/server/order-operation-service";

const input = {
  orderId: "124bf462-6765-451c-8db8-d47976ec9595",
  adminId: "a70d9361-91cd-4d47-873f-7e5780fa23cc",
};

const routePlan = {
  origin: [11.5, 3.8] as [number, number],
  destination: [11.6, 3.9] as [number, number],
  geometry: {
    type: "LineString" as const,
    coordinates: [
      [11.5, 3.8],
      [11.6, 3.9],
    ] as Array<[number, number]>,
  },
  distanceMeters: 20_000,
  durationSeconds: 2_000,
  dispatchedAt: new Date("2026-08-16T00:00:00.000Z"),
  estimatedArrivalAt: new Date("2026-08-16T00:33:20.000Z"),
  providerId: "mapbox-directions-v5",
  routeKind: "DRIVING" as const,
  providerError: null,
};

describe("admin order operations", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    transaction.order.updateMany.mockResolvedValue({ count: 1 });
    transaction.deliveryTracking.upsert.mockResolvedValue({});
    transaction.deliveryTracking.updateMany.mockResolvedValue({ count: 1 });
    prepareDeliveryTracking.mockResolvedValue(routePlan);
    transaction.orderStatusEvent.create.mockResolvedValue({});
    transaction.orderPaymentStatusEvent.create.mockResolvedValue({});
    transaction.storeSettings.findUnique.mockResolvedValue({
      dispatchLatitude: 3.8,
      dispatchLongitude: 11.5,
    });
  });

  it("exposes fulfillment-aware transitions", () => {
    expect(validOrderTransitions("PROCESSING", "PICKUP")).toEqual([
      "READY",
      "CANCELLED",
    ]);
    expect(validOrderTransitions("PROCESSING", "DELIVERY")).toEqual([
      "OUT_FOR_DELIVERY",
      "CANCELLED",
    ]);
  });

  it("requires verified payment before confirming an order", async () => {
    transaction.order.findUnique.mockResolvedValue({
      status: "PENDING",
      paymentStatus: "PENDING",
      fulfillmentType: "PICKUP",
    });
    await expect(
      new AdminOrderOperationService().updateOrderStatus({
        ...input,
        toStatus: "CONFIRMED",
      }),
    ).rejects.toMatchObject({ code: "PAYMENT_REQUIRED" });
    expect(transaction.order.updateMany).not.toHaveBeenCalled();
  });

  it("changes order status and records the administrator event atomically", async () => {
    transaction.order.findUnique.mockResolvedValue({
      status: "PROCESSING",
      paymentStatus: "PAID",
      fulfillmentType: "DELIVERY",
      destinationLatitude: 3.9,
      destinationLongitude: 11.6,
    });
    await expect(
      new AdminOrderOperationService().updateOrderStatus({
        ...input,
        toStatus: "OUT_FOR_DELIVERY",
        note: "Courier collected the order.",
      }),
    ).resolves.toEqual({ status: "OUT_FOR_DELIVERY" });
    expect(withTransaction).toHaveBeenCalledOnce();
    expect(prepareDeliveryTracking).toHaveBeenCalledWith(input.orderId);
    expect(transaction.deliveryTracking.upsert).toHaveBeenCalledOnce();
    expect(transaction.order.updateMany).toHaveBeenCalledWith({
      where: { id: input.orderId, status: "PROCESSING" },
      data: { status: "OUT_FOR_DELIVERY" },
    });
    expect(transaction.orderStatusEvent.create).toHaveBeenCalledWith({
      data: {
        orderId: input.orderId,
        fromStatus: "PROCESSING",
        toStatus: "OUT_FOR_DELIVERY",
        changedByAdminId: input.adminId,
        note: "Courier collected the order.",
      },
    });
  });

  it("blocks dispatch when routing coordinates are missing", async () => {
    transaction.order.findUnique.mockResolvedValue({
      status: "PROCESSING",
      paymentStatus: "PAID",
      fulfillmentType: "DELIVERY",
      destinationLatitude: null,
      destinationLongitude: null,
    });
    await expect(
      new AdminOrderOperationService().updateOrderStatus({
        ...input,
        toStatus: "OUT_FOR_DELIVERY",
      }),
    ).rejects.toMatchObject({ code: "ROUTING_LOCATION_REQUIRED" });
    expect(transaction.order.updateMany).not.toHaveBeenCalled();
  });

  it("records each payment decision in a dedicated audit event", async () => {
    transaction.order.findUnique.mockResolvedValue({
      paymentStatus: "PENDING",
    });
    await expect(
      new AdminOrderOperationService().updatePaymentStatus({
        ...input,
        toStatus: "PAID",
        note: "Recharge code verified.",
      }),
    ).resolves.toEqual({ paymentStatus: "PAID" });
    expect(transaction.orderPaymentStatusEvent.create).toHaveBeenCalledWith({
      data: {
        orderId: input.orderId,
        fromStatus: "PENDING",
        toStatus: "PAID",
        changedByAdminId: input.adminId,
        note: "Recharge code verified.",
      },
    });
  });

  it("rejects stale concurrent updates before writing an event", async () => {
    transaction.order.findUnique.mockResolvedValue({
      status: "CONFIRMED",
      paymentStatus: "PAID",
      fulfillmentType: "PICKUP",
    });
    transaction.order.updateMany.mockResolvedValue({ count: 0 });
    await expect(
      new AdminOrderOperationService().updateOrderStatus({
        ...input,
        toStatus: "PROCESSING",
      }),
    ).rejects.toMatchObject({ code: "CONFLICT" });
    expect(transaction.orderStatusEvent.create).not.toHaveBeenCalled();
  });

  it("completes and cancels persistent tracking with terminal order states", async () => {
    transaction.order.findUnique.mockResolvedValue({
      status: "OUT_FOR_DELIVERY",
      paymentStatus: "PAID",
      fulfillmentType: "DELIVERY",
    });
    await new AdminOrderOperationService().updateOrderStatus({
      ...input,
      toStatus: "COMPLETED",
    });
    expect(transaction.deliveryTracking.updateMany).toHaveBeenCalledWith({
      where: { orderId: input.orderId },
      data: { state: "COMPLETED" },
    });

    vi.clearAllMocks();
    transaction.order.updateMany.mockResolvedValue({ count: 1 });
    transaction.orderStatusEvent.create.mockResolvedValue({});
    transaction.deliveryTracking.updateMany.mockResolvedValue({ count: 1 });
    transaction.order.findUnique.mockResolvedValue({
      status: "PROCESSING",
      paymentStatus: "PAID",
      fulfillmentType: "DELIVERY",
    });
    await new AdminOrderOperationService().updateOrderStatus({
      ...input,
      toStatus: "CANCELLED",
    });
    expect(transaction.deliveryTracking.updateMany).toHaveBeenCalledWith({
      where: { orderId: input.orderId },
      data: { state: "CANCELLED" },
    });
  });

  it("does not allow changes after a terminal status", async () => {
    transaction.order.findUnique.mockResolvedValue({
      status: "COMPLETED",
      paymentStatus: "PAID",
      fulfillmentType: "PICKUP",
    });
    await expect(
      new AdminOrderOperationService().updateOrderStatus({
        ...input,
        toStatus: "CANCELLED",
      }),
    ).rejects.toMatchObject({ code: "INVALID_TRANSITION" });
  });
});
