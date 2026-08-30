"use client";

import { ErrorState } from "@/components/ui";

export default function AdminOffersError({ reset }: { reset: () => void }) {
  return (
    <div className="mx-auto max-w-6xl">
      <ErrorState
        title="Campaigns could not be loaded"
        description="The offer workspace is temporarily unavailable. Your campaign data was not changed."
        retryLabel="Try again"
        onRetry={reset}
      />
    </div>
  );
}
