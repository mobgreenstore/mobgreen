import type { SupportedCurrency, WeightUnit } from "@/config/commerce";
import type { PublicDeliveryTracking } from "@/features/tracking/types";

export const ORDER_STATUSES = [
  "PENDING",
  "CONFIRMED",
  "PROCESSING",
  "READY",
  "OUT_FOR_DELIVERY",
  "COMPLETED",
  "CANCELLED",
] as const;
export const PAYMENT_STATUSES = [
  "UNPAID",
  "PENDING",
  "PAID",
  "REFUNDED",
] as const;
export const ORDER_SORTS = [
  "created-desc",
  "created-asc",
  "total-desc",
  "total-asc",
  "reference-asc",
] as const;

export type AdminOrderStatus = (typeof ORDER_STATUSES)[number];
export type AdminPaymentStatus = (typeof PAYMENT_STATUSES)[number];
export type AdminOrderSort = (typeof ORDER_SORTS)[number];

export interface AdminOrderListItem {
  id: string;
  reference: string;
  customerName: string;
  customerEmail: string | null;
  customerPhone: string | null;
  fulfillmentType: "PICKUP" | "DELIVERY";
  paymentMethod: "RECHARGE_FROM_STORE" | "RECHARGE_ONLINE" | "BITCOIN_DEPOSIT";
  rechargeProvider: string | null;
  currency: SupportedCurrency;
  totalMinor: number;
  status: AdminOrderStatus;
  paymentStatus: AdminPaymentStatus;
  itemCount: number;
  createdAt: string;
}

export interface AdminOrderListView {
  orders: AdminOrderListItem[];
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
}

export interface AdminOrderDetail extends AdminOrderListItem {
  customerNote: string | null;
  deliveryLocation: {
    formattedAddress: string;
    postalCode: string | null;
    locality: string | null;
    countryCode: string | null;
  } | null;
  courierCandidateId: string | null;
  courierCandidates: import("@/features/delivery-matching/types").SimulatedCourierCandidate[];
  courierAssignmentLocked: boolean;
  courier: {
    displayName: string;
    distanceMeters: number;
    estimatedDurationSeconds: number;
    simulated: true;
  } | null;
  destinationCoordinatesPresent: boolean;
  dispatchConfigured: boolean;
  tracking:
    | (PublicDeliveryTracking & {
        providerId: string;
        lastProviderError: string | null;
      })
    | null;
  verificationCodeAvailable: boolean;
  paymentAttempt: {
    publicId: string;
    status: string;
    provider: string;
    depositMinor: number;
    cashBalanceDueMinor: number;
    expectedSatoshis: number | null;
    receivedSatoshis: number;
    transactionId: string | null;
    confirmationCount: number;
    cashCollectedAt: string | null;
    expiresAt: string | null;
    maskedCodes: string[];
    events: Array<{
      id: string;
      eventType: string;
      fromStatus: string | null;
      toStatus: string;
      occurredAt: string;
    }>;
  } | null;
  notification: {
    status: "PENDING" | "PROCESSING" | "SENT" | "FAILED";
    attemptCount: number;
    sentAt: string | null;
    lastError: string | null;
  } | null;
  customerNotification: {
    status: "PENDING" | "PROCESSING" | "SENT" | "FAILED";
    attemptCount: number;
    sentAt: string | null;
    lastError: string | null;
  } | null;
  items: Array<{
    id: string;
    productName: string;
    weightValue: number;
    weightUnit: WeightUnit;
    currency: SupportedCurrency;
    unitPriceMinor: number;
    quantity: number;
    lineTotalMinor: number;
    offer: {
      originalTotalMinor: number;
      discountBps: number;
      discountMinor: number;
      offerTotalMinor: number;
      bundleQuantity: number;
      endsAt: string;
    } | null;
  }>;
  timeline: Array<{
    id: string;
    kind: "ORDER" | "PAYMENT";
    fromStatus: string | null;
    toStatus: string;
    note: string | null;
    changedBy: string | null;
    occurredAt: string;
  }>;
}
