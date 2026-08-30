import "server-only";

import { parseStoredCourierCandidates } from "@/features/delivery-matching/server/candidate-set";
import { logger } from "@/server/core/logger";
import { withTransaction } from "@/server/db/transaction";

const CLOSED_OR_DISPATCHED = new Set([
  "OUT_FOR_DELIVERY",
  "COMPLETED",
  "CANCELLED",
]);

export class CourierReassignmentError extends Error {
  constructor(
    readonly code:
      | "ORDER_NOT_FOUND"
      | "NOT_DELIVERY"
      | "ASSIGNMENT_LOCKED"
      | "CANDIDATE_UNAVAILABLE",
    message: string,
  ) {
    super(message);
    this.name = "CourierReassignmentError";
  }
}

export class AdminCourierReassignmentService {
  async reassign(input: {
    orderId: string;
    candidateId: string;
    adminId: string;
  }) {
    const result = await withTransaction(async (transaction) => {
      const order = await transaction.order.findUnique({
        where: { id: input.orderId },
        select: {
          id: true,
          status: true,
          fulfillmentType: true,
          courierNameSnapshot: true,
          checkoutIntent: {
            select: { id: true, candidateSet: true },
          },
        },
      });
      if (!order) {
        throw new CourierReassignmentError(
          "ORDER_NOT_FOUND",
          "The order could not be found.",
        );
      }
      if (order.fulfillmentType !== "DELIVERY") {
        throw new CourierReassignmentError(
          "NOT_DELIVERY",
          "Courier assignment is available only for delivery orders.",
        );
      }
      if (CLOSED_OR_DISPATCHED.has(order.status)) {
        throw new CourierReassignmentError(
          "ASSIGNMENT_LOCKED",
          "Courier assignment is locked after dispatch or closure.",
        );
      }
      const candidate = parseStoredCourierCandidates(
        order.checkoutIntent?.candidateSet ?? null,
      ).find((item) => item.candidateId === input.candidateId);
      if (!candidate) {
        throw new CourierReassignmentError(
          "CANDIDATE_UNAVAILABLE",
          "Choose one of the server-generated candidates for this order.",
        );
      }

      await transaction.order.update({
        where: { id: order.id },
        data: {
          courierProfileIdSnapshot: candidate.profileId,
          courierNameSnapshot: candidate.displayName,
          courierDistanceMeters: candidate.distanceMeters,
          courierDurationSeconds: candidate.estimatedDurationSeconds,
        },
      });
      if (order.checkoutIntent) {
        await transaction.checkoutIntent.update({
          where: { id: order.checkoutIntent.id },
          data: {
            selectedCourierProfileId: candidate.profileId,
            selectedCourierName: candidate.displayName,
            selectedDistanceMeters: candidate.distanceMeters,
            selectedDurationSeconds: candidate.estimatedDurationSeconds,
          },
        });
      }
      await transaction.orderStatusEvent.create({
        data: {
          orderId: order.id,
          fromStatus: order.status,
          toStatus: order.status,
          note: `Simulated courier reassigned from ${order.courierNameSnapshot ?? "unassigned"} to ${candidate.displayName}.`,
          changedByAdminId: input.adminId,
        },
      });
      return candidate;
    });
    logger.info("delivery.courier_reassigned", {
      orderId: input.orderId,
      candidateId: result.candidateId,
      adminId: input.adminId,
    });
    return result;
  }
}
