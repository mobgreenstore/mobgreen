import type { SupportedCurrency } from "@/config/commerce";
import type { AdminOrderStatus } from "@/features/orders/types";

export type PublicPaymentStatus = "UNPAID" | "PENDING" | "PAID" | "REFUNDED";
export type PublicFulfillmentType = "PICKUP" | "DELIVERY";
export type CustomerOrderTab = "active" | "completed" | "cancelled" | "pending";

export interface PublicOrderListItem {
  reference: string;
  status: AdminOrderStatus;
  paymentStatus: PublicPaymentStatus;
  fulfillmentType: PublicFulfillmentType;
  currency: SupportedCurrency;
  totalMinor: number;
  createdAt: string;
  estimatedDelivery: string | null;
  firstImage: { url: string; altText: string } | null;
  itemCount: number;
  trackingAvailable: boolean;
}

export interface PublicOrderListView {
  orders: PublicOrderListItem[];
  page: number;
  pageCount: number;
  total: number;
  tab: CustomerOrderTab;
}

export interface PublicOrderDetail extends PublicOrderListItem {
  deliveryMatchingIntentId: string | null;
  customerName: string;
  deliveryLocation: {
    formattedAddress: string;
    postalCode: string | null;
    countryCode: string | null;
  } | null;
  courier: {
    displayName: string;
    distanceMeters: number;
    estimatedDurationSeconds: number;
    simulated: true;
  } | null;
  items: Array<{
    name: string;
    weightValue: string;
    weightUnit: "G" | "KG";
    unitPriceMinor: number;
    quantity: number;
    lineTotalMinor: number;
    image: { url: string; altText: string } | null;
  }>;
  timeline: Array<{ status: AdminOrderStatus; createdAt: string }>;
}

export type { PublicTrackingView } from "@/features/tracking/types";
