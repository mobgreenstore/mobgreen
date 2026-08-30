"use client";

import { ErrorState } from "@/components/ui";

export default function CategoriesError({ reset }: { reset: () => void }) {
  return (
    <div className="mx-auto max-w-6xl">
      <ErrorState
        title="Categories could not be loaded"
        description="The database request failed. Check the connection and try again."
        retryLabel="Try again"
        onRetry={reset}
      />
    </div>
  );
}
