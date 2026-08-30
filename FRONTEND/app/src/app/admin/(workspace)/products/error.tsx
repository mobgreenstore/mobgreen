"use client";

import { ErrorState } from "@/components/ui";

export default function ProductsError({ reset }: { reset: () => void }) {
  return (
    <div className="mx-auto max-w-7xl">
      <ErrorState
        title="Products could not be loaded"
        description="The real product query failed. Check the connection and try again."
        retryLabel="Try again"
        onRetry={reset}
      />
    </div>
  );
}
