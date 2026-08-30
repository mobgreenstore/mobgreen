import { Inbox } from "lucide-react";
import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";

interface EmptyStateProps extends Omit<
  HTMLAttributes<HTMLDivElement>,
  "title"
> {
  title: ReactNode;
  description?: ReactNode;
  icon?: ReactNode;
  action?: ReactNode;
  compact?: boolean;
}

export function EmptyState({
  title,
  description,
  icon,
  action,
  compact = false,
  className,
  ...props
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "grid place-items-center rounded-lg border border-dashed border-border-strong bg-background px-5 text-center",
        compact ? "min-h-48 py-8" : "min-h-72 py-12",
        className,
      )}
      {...props}
    >
      <div className="max-w-md">
        <div className="mx-auto grid size-11 place-items-center rounded-md bg-surface-subtle text-foreground-muted">
          {icon ?? (
            <Inbox aria-hidden="true" className="size-5" strokeWidth={1.8} />
          )}
        </div>
        <h3 className="mt-4 text-base font-semibold tracking-[-0.02em]">
          {title}
        </h3>
        {description && (
          <div className="mt-2 text-sm leading-6 text-foreground-muted">
            {description}
          </div>
        )}
        {action && <div className="mt-5 flex justify-center">{action}</div>}
      </div>
    </div>
  );
}
