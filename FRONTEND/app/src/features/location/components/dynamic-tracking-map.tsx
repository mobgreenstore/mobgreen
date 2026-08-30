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
        className="min-h-72 animate-pulse rounded-2xl bg-surface-subtle motion-reduce:animate-none"
      />
    ),
  },
);

export function DynamicTrackingMap({
  tracking,
  compact = false,
}: {
  tracking: PublicDeliveryTracking;
  compact?: boolean;
}) {
  return <LazyTrackingMap tracking={tracking} compact={compact} />;
}
