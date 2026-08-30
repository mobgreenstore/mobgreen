import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function FilterBar({
  search,
  filters,
  actions,
  className,
}: {
  search?: ReactNode;
  filters?: ReactNode;
  actions?: ReactNode;
  className?: string;
}) {
  return (
    <section
      aria-label="Filters"
      className={cn(
        "grid gap-3 rounded-lg border border-border bg-surface p-3 shadow-xs lg:grid-cols-[minmax(16rem,1fr)_auto_auto] lg:items-center",
        className,
      )}
    >
      <div>{search}</div>
      {filters && <div className="flex flex-wrap gap-2">{filters}</div>}
      {actions && (
        <div className="flex items-center justify-end gap-2">{actions}</div>
      )}
    </section>
  );
}
