"use client";

import { RotateCcw, TriangleAlert } from "lucide-react";
import type { HTMLAttributes, ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ErrorStateProps extends Omit<
  HTMLAttributes<HTMLDivElement>,
  "title"
> {
  title?: ReactNode;
  description?: ReactNode;
  retryLabel?: string;
  onRetry?: () => void;
}

export function ErrorState({
  title = "Something went wrong",
  description = "The information could not be loaded. Try again.",
  retryLabel = "Try again",
  onRetry,
  className,
  ...props
}: ErrorStateProps) {
  return (
    <div
      role="alert"
      className={cn(
        "grid min-h-64 place-items-center rounded-lg border border-danger/25 bg-danger-subtle/40 px-5 py-10 text-center",
        className,
      )}
      {...props}
    >
      <div className="max-w-md">
        <div className="mx-auto grid size-11 place-items-center rounded-md bg-danger-subtle text-danger">
          <TriangleAlert aria-hidden="true" className="size-5" />
        </div>
        <h3 className="mt-4 text-base font-semibold tracking-[-0.02em]">
          {title}
        </h3>
        <div className="mt-2 text-sm leading-6 text-foreground-muted">
          {description}
        </div>
        {onRetry && (
          <Button variant="secondary" className="mt-5" onClick={onRetry}>
            <RotateCcw aria-hidden="true" className="size-4" /> {retryLabel}
          </Button>
        )}
      </div>
    </div>
  );
}
