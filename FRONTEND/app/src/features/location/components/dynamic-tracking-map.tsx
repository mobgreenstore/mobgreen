"use client";

import dynamic from "next/dynamic";
import type { PublicDeliveryTracking } from "@/features/tracking/types";

const LazyTrackingMap = dynamic(
  () =>
    import("@/features/location/components/tracking-map").then(
      (module) => module.TrackingMap,
    ),
  {
    ssr: false,
    loading: () => (
      <div
        role="status"
        aria-label="Loading delivery map"
        className="-mx-3 h-[calc(100svh-7.5rem)] min-h-[34rem] max-h-[54rem] animate-pulse bg-surface-subtle motion-reduce:animate-none sm:mx-0 sm:rounded-[1.75rem]"
      />
    ),
  },
);

const LazyCompactTrackingMap = dynamic(
  () =>
    import("@/features/location/components/tracking-map").then(
      (module) => module.TrackingMap,
    ),
  {
    ssr: false,
    loading: () => (
      <div
        role="status"
        aria-label="Loading delivery map"
        className="h-[260px] animate-pulse rounded-2xl bg-surface-subtle motion-reduce:animate-none"
      />
    ),
  },
);

export function DynamicTrackingMap({
  tracking,
  compact = false,
  courierName,
  statusLabel,
  distanceRemainingLabel,
  timeRemainingLabel,
  arrivalLabel,
}: {
  tracking: PublicDeliveryTracking;
  compact?: boolean;
  courierName?: string;
  statusLabel?: string;
  distanceRemainingLabel?: string;
  timeRemainingLabel?: string;
  arrivalLabel?: string;
}) {
  const MapComponent = compact ? LazyCompactTrackingMap : LazyTrackingMap;
  return (
    <MapComponent
      tracking={tracking}
      compact={compact}
      {...(courierName ? { courierName } : {})}
      {...(statusLabel ? { statusLabel } : {})}
      {...(distanceRemainingLabel ? { distanceRemainingLabel } : {})}
      {...(timeRemainingLabel ? { timeRemainingLabel } : {})}
      {...(arrivalLabel ? { arrivalLabel } : {})}
    />
  );
}
