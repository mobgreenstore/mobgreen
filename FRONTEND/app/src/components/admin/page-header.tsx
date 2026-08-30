import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function PageHeader({
  title,
  description,
  eyebrow,
  actions,
  className,
}: {
  title: ReactNode;
  description?: ReactNode;
  eyebrow?: ReactNode;
  actions?: ReactNode;
  className?: string;
}) {
  return (
    <header
      className={cn(
        "flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between",
        className,
      )}
    >
      <div className="max-w-2xl">
        {eyebrow && <div className="mb-3">{eyebrow}</div>}
        <h1 className="heading-page">{title}</h1>
        {description && (
          <div className="mt-2 text-sm leading-6 text-foreground-muted sm:text-base">
            {description}
          </div>
        )}
      </div>
      {actions && (
        <div className="flex shrink-0 flex-col gap-2 sm:flex-row">
          {actions}
        </div>
      )}
    </header>
  );
}
