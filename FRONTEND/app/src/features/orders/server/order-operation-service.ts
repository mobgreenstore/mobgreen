import "server-only";

import type {
  FulfillmentType,
  OrderStatus,
  PaymentStatus,
} from "@/generated/prisma/client";
import {
  DeliveryTrackingError,
  prepareDeliveryTracking,
  trackingCreateData,
  trackingUpdateData,
} from "@/features/tracking/server/service";
import type { TrackingRoutePlan } from "@/features/tracking/types";
import { withTransaction } from "@/server/db/transaction";

const orderTransitions: Record<OrderStatus, readonly OrderStatus[]> = {
  PENDING: ["CONFIRMED", "CANCELLED"],
  CONFIRMED: ["PROCESSING", "CANCELLED"],
  PROCESSING: ["READY", "OUT_FOR_DELIVERY", "CANCELLED"],
  READY: ["COMPLETED", "CANCELLED"],
  OUT_FOR_DELIVERY: ["COMPLETED", "CANCELLED"],
  COMPLETED: [],
  CANCELLED: [],
};

const paymentTransitions: Record<PaymentStatus, readonly PaymentStatus[]> = {
  UNPAID: ["PENDING"],
  PENDING: ["PAID", "UNPAID"],
  PAID: ["REFUNDED"],
  REFUNDED: [],
};

export class OrderOperationError extends Error {
  constructor(
    readonly code:
      | "NOT_FOUND"
      | "INVALID_TRANSITION"
      | "PAYMENT_REQUIRED"
      | "FULFILLMENT_CONFLICT"
      | "ROUTING_LOCATION_REQUIRED"
      | "TRACKING_UNAVAILABLE"
      | "CONFLICT",
    message: string,
  ) {
    super(message);
    this.name = "OrderOperationError";
  }
}

export function validOrderTransitions(
  status: OrderStatus,
  fulfillment: FulfillmentType,
) {
  return orderTransitions[status].filter((next) => {
    if (status !== "PROCESSING") return true;
    if (fulfillment === "PICKUP") return next !== "OUT_FOR_DELIVERY";
    return next !== "READY";
  });
}

export function validPaymentTransitions(status: PaymentStatus) {
  return [...paymentTransitions[status]];
}

function trackingError(error: unknown): never {
  if (error instanceof DeliveryTrackingError) {
    throw new OrderOperationError(
      error.code === "NOT_FOUND" ? "NOT_FOUND" : "ROUTING_LOCATION_REQUIRED",
      error.message,
    );
  }
  throw error;
}

export class AdminOrderOperationService {
  async updateOrderStatus(input: {
    orderId: string;
    toStatus: OrderStatus;
    adminId: string;
    note?: string;
  }) {
    let routePlan: TrackingRoutePlan | null = null;
    if (input.toStatus === "OUT_FOR_DELIVERY") {
      try {
        routePlan = await prepareDeliveryTracking(input.orderId);
      } catch (error) {
        trackingError(error);
      }
    }

    return withTransaction(async (transaction) => {
      const current = await transaction.order.findUnique({
        where: { id: input.orderId },
        select: {
          status: true,
          paymentStatus: true,
          fulfillmentType: true,
          destinationLatitude: true,
          destinationLongitude: true,
        },
      });
      if (!current)
        throw new OrderOperationError("NOT_FOUND", "Order not found.");
      const allowed = validOrderTransitions(
        current.status,
        current.fulfillmentType,
      );
      if (!allowed.includes(input.toStatus)) {
        throw new OrderOperationError(
          "INVALID_TRANSITION",
          "That order status transition is not allowed.",
        );
      }
      if (
        input.toStatus === "OUT_FOR_DELIVERY" &&
        (!routePlan ||
          current.fulfillmentType !== "DELIVERY" ||
          current.destinationLatitude === null ||
          current.destinationLongitude === null ||
          Number(current.destinationLongitude) !== routePlan.destination[0] ||
          Number(current.destinationLatitude) !== routePlan.destination[1])
      ) {
        throw new OrderOperationError(
          "ROUTING_LOCATION_REQUIRED",
          "The routing locations changed. Refresh and generate the route again.",
        );
      }
      if (input.toStatus === "CONFIRMED" && current.paymentStatus !== "PAID") {
        throw new OrderOperationError(
          "PAYMENT_REQUIRED",
          "Verify payment before confirming the order.",
        );
      }
      const updated = await transaction.order.updateMany({
        where: { id: input.orderId, status: current.status },
        data: { status: input.toStatus },
      });
      if (updated.count !== 1) {
        throw new OrderOperationError(
          "CONFLICT",
          "The order changed. Refresh and try again.",
        );
      }

      if (routePlan) {
        await transaction.deliveryTracking.upsert({
          where: { orderId: input.orderId },
          create: trackingCreateData(input.orderId, routePlan),
          update: trackingUpdateData(routePlan),
        });
      } else if (input.toStatus === "COMPLETED") {
        await transaction.deliveryTracking.updateMany({
          where: { orderId: input.orderId },
          data: { state: "COMPLETED" },
        });
      } else if (input.toStatus === "CANCELLED") {
        await transaction.deliveryTracking.updateMany({
          where: { orderId: input.orderId },
          data: { state: "CANCELLED" },
        });
      }

      await transaction.orderStatusEvent.create({
        data: {
          orderId: input.orderId,
          fromStatus: current.status,
          toStatus: input.toStatus,
          changedByAdminId: input.adminId,
          note:
            input.note?.trim() ||
            (routePlan
              ? routePlan.routeKind === "DRIVING"
                ? "Delivery route generated and simulated tracking started."
                : "Driving route unavailable; simulated direct trajectory started."
              : null),
        },
      });
      return { status: input.toStatus };
    });
  }

  async regenerateTracking(input: {
    orderId: string;
    adminId: string;
    note?: string;
  }) {
    let routePlan: TrackingRoutePlan;
    try {
      routePlan = await prepareDeliveryTracking(input.orderId);
    } catch (error) {
      trackingError(error);
    }
    return withTransaction(async (transaction) => {
      const current = await transaction.order.findUnique({
        where: { id: input.orderId },
        select: { status: true, fulfillmentType: true },
      });
      if (!current)
        throw new OrderOperationError("NOT_FOUND", "Order not found.");
      if (
        current.fulfillmentType !== "DELIVERY" ||
        current.status !== "OUT_FOR_DELIVERY"
      ) {
        throw new OrderOperationError(
          "TRACKING_UNAVAILABLE",
          "Only dispatched delivery orders can regenerate tracking.",
        );
      }
      await transaction.deliveryTracking.upsert({
        where: { orderId: input.orderId },
        create: trackingCreateData(input.orderId, routePlan),
        update: trackingUpdateData(routePlan),
      });
      await transaction.orderStatusEvent.create({
        data: {
          orderId: input.orderId,
          fromStatus: current.status,
          toStatus: current.status,
          changedByAdminId: input.adminId,
          note:
            input.note?.trim() ||
            (routePlan.routeKind === "DRIVING"
              ? "Delivery route safely regenerated."
              : "Route regenerated using the simulated direct fallback."),
        },
      });
      return { status: current.status };
    });
  }

  async updatePaymentStatus(input: {
    orderId: string;
    toStatus: PaymentStatus;
    adminId: string;
    note?: string;
  }) {
    return withTransaction(async (transaction) => {
      const current = await transaction.order.findUnique({
        where: { id: input.orderId },
        select: { paymentStatus: true },
      });
      if (!current)
        throw new OrderOperationError("NOT_FOUND", "Order not found.");
      if (!paymentTransitions[current.paymentStatus].includes(input.toStatus)) {
        throw new OrderOperationError(
          "INVALID_TRANSITION",
          "That payment status transition is not allowed.",
        );
      }
      const updated = await transaction.order.updateMany({
        where: { id: input.orderId, paymentStatus: current.paymentStatus },
        data: { paymentStatus: input.toStatus },
      });
      if (updated.count !== 1) {
        throw new OrderOperationError(
          "CONFLICT",
          "The payment changed. Refresh and try again.",
        );
      }
      await transaction.orderPaymentStatusEvent.create({
        data: {
          orderId: input.orderId,
          fromStatus: current.paymentStatus,
          toStatus: input.toStatus,
          changedByAdminId: input.adminId,
          note: input.note?.trim() || null,
        },
      });
      return { paymentStatus: input.toStatus };
    });
  }
}
