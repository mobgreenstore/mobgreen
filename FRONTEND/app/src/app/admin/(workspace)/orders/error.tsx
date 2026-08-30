"use client";

import { ErrorState } from "@/components/ui";

export default function OrdersError({ reset }: { reset: () => void }) {
  return (
    <div className="mx-auto max-w-7xl">
      <ErrorState
        title="Orders could not be loaded"
        description="The order workspace is temporarily unavailable."
        onRetry={reset}
      />
    </div>
  );
}
