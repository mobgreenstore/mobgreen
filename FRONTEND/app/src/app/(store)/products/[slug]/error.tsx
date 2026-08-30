"use client";

import { StoreHeader } from "@/components/shared/store-header";
import { ErrorState } from "@/components/ui";

export default function ProductError({ reset }: { reset: () => void }) {
  return (
    <div className="min-h-dvh bg-background">
      <StoreHeader />
      <main className="mx-auto max-w-[var(--content-max)] px-4 py-12 sm:px-6 lg:px-8">
        <ErrorState
          title="The product could not be loaded"
          description="The product request failed. Please try again."
          retryLabel="Try again"
          onRetry={reset}
        />
      </main>
    </div>
  );
}
