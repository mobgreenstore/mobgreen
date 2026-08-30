"use client";

import { ErrorState } from "@/components/ui";

export default function DeliveriesError({ reset }: { reset: () => void }) {
  return (
    <div className="mx-auto max-w-7xl">
      <ErrorState
        title="Deliveries could not be loaded"
        description="The delivery operations workspace is temporarily unavailable."
        onRetry={reset}
      />
    </div>
  );
}
