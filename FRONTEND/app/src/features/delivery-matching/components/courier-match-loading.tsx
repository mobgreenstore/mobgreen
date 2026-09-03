"use client";

import { Route } from "lucide-react";
import { cn } from "@/lib/utils";

export function CourierMatchLoading({
  locationLabel,
  slow = false,
  className,
}: {
  locationLabel?: string;
  slow?: boolean;
  className?: string;
}) {
  return (
    <section
      aria-live="polite"
      aria-label="Finding nearby delivery profiles"
      className={cn(
        "grid min-h-64 place-items-center border-y border-border px-5 py-10 text-center",
        className,
      )}
    >
      <div>
        <Route
          aria-hidden="true"
          className="mx-auto size-8 text-info"
          strokeWidth={1.7}
        />
        <h2 className="mt-4 text-xl font-semibold tracking-[-0.03em]">
          Finding nearby delivery profiles
        </h2>
        <div className="mt-3 flex justify-center gap-1.5" aria-hidden="true">
          {[0, 1, 2].map((dot) => (
            <span
              key={dot}
              className="size-2 rounded-full bg-info motion-safe:animate-bounce motion-reduce:animate-none"
              style={{ animationDelay: `${dot * 160}ms` }}
            />
          ))}
        </div>
        <p className="mt-4 text-sm text-foreground-muted">
          {locationLabel || "Confirmed destination"}
        </p>
        {slow && (
          <p className="mt-3 text-xs text-foreground-subtle">
            This is taking longer than usual. Keep this page open.
          </p>
        )}
      </div>
    </section>
  );
}
