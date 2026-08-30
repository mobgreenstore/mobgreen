import type {
  AdminOrderStatus,
  AdminPaymentStatus,
} from "@/features/orders/types";

export const DELIVERY_TRACKING_FILTERS = [
  "all",
  "NOT_STARTED",
  "ACTIVE",
  "PAUSED",
  "COMPLETED",
  "CANCELLED",
] as const;

export const DELIVERY_SORTS = [
  "created-desc",
  "created-asc",
  "distance-asc",
  "eta-asc",
] as const;

export type DeliveryTrackingFilter = (typeof DELIVERY_TRACKING_FILTERS)[number];
export type DeliverySort = (typeof DELIVERY_SORTS)[number];

export interface AdminDeliveryFilters {
  search: string;
  status: AdminOrderStatus | "all";
  tracking: DeliveryTrackingFilter;
  courier: string;
  sort: DeliverySort;
  page: number;
}

export interface AdminDeliveryListItem {
  id: string;
  reference: string;
  customerName: string;
  locality: string | null;
  status: AdminOrderStatus;
  paymentStatus: AdminPaymentStatus;
  courierName: string | null;
  courierDistanceMeters: number | null;
  courierDurationSeconds: number | null;
  trackingState: Exclude<DeliveryTrackingFilter, "all" | "NOT_STARTED"> | null;
  estimatedArrivalAt: string | null;
  createdAt: string;
}

export interface AdminDeliveryListView {
  deliveries: AdminDeliveryListItem[];
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
  metrics: {
    open: number;
    outForDelivery: number;
    activeTracking: number;
    withoutCourier: number;
  };
}
