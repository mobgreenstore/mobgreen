import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function AdminTableToolbar({
  title,
  count,
  selection,
  actions,
  className,
}: {
  title: ReactNode;
  count?: number;
  selection?: ReactNode;
  actions?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex min-h-14 flex-col gap-3 border-b border-border px-4 py-3 sm:flex-row sm:items-center sm:justify-between",
        className,
      )}
    >
      <div className="flex items-center gap-2">
        <h2 className="font-semibold tracking-[-0.02em]">{title}</h2>
        {count !== undefined && (
          <span className="font-mono text-xs text-foreground-muted">
            {count}
          </span>
        )}
        {selection}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}
