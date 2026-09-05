import type { AdminOrderStatus } from "@/features/orders/types";

export type TrackingState = "ACTIVE" | "PAUSED" | "COMPLETED" | "CANCELLED";
export type TrackingRouteKind = "DRIVING" | "DIRECT_FALLBACK";
export type TrackingCoordinate = [longitude: number, latitude: number];

export interface TrackingGeometry {
  type: "LineString";
  coordinates: TrackingCoordinate[];
}

export interface TrackingRoutePlan {
  origin: TrackingCoordinate;
  destination: TrackingCoordinate;
  geometry: TrackingGeometry;
  distanceMeters: number;
  durationSeconds: number;
  dispatchedAt: Date;
  estimatedArrivalAt: Date;
  providerId: string;
  routeKind: TrackingRouteKind;
  providerError: string | null;
}

export interface TrackingProgress {
  progress: number;
  courier: TrackingCoordinate;
  distanceRemainingMeters: number;
  timeRemainingSeconds: number;
  serverTimestamp: string;
}

export interface PublicDeliveryTracking {
  state: TrackingState;
  routeKind: TrackingRouteKind;
  /** A route generated from the selected simulated courier's saved metrics. */
  isSimulated?: boolean;
  routeDisclosure: string;
  geometry: TrackingGeometry;
  origin: TrackingCoordinate;
  destination: TrackingCoordinate;
  courier: TrackingCoordinate;
  routeDistanceMeters: number;
  distanceRemainingMeters: number;
  estimatedDurationSeconds: number;
  timeRemainingSeconds: number;
  dispatchedAt: string;
  estimatedArrivalAt: string;
  serverTimestamp: string;
  progress: number;
}

export interface PublicTrackingView {
  reference: string;
  status: AdminOrderStatus;
  fulfillmentType: "DELIVERY";
  deliveryAddress: {
    formattedAddress: string;
    postalCode: string | null;
    locality: string | null;
  };
  tracking: PublicDeliveryTracking;
  events: Array<{ status: AdminOrderStatus; createdAt: string }>;
}
