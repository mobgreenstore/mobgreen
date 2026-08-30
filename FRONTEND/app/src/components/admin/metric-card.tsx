import type { ReactNode } from "react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export function MetricCard({
  label,
  value,
  note,
  icon,
  trend,
  className,
}: {
  label: ReactNode;
  value: ReactNode;
  note?: ReactNode;
  icon?: ReactNode;
  trend?: ReactNode;
  className?: string;
}) {
  return (
    <Card className={cn("p-5", className)}>
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm font-medium text-foreground-muted">{label}</p>
        {icon && <span className="text-foreground-subtle">{icon}</span>}
      </div>
      <div className="mt-5 flex items-baseline gap-2">
        <p className="font-mono text-3xl font-semibold tracking-[-0.04em]">
          {value}
        </p>
        {trend}
      </div>
      {note && (
        <div className="mt-2 text-xs leading-5 text-foreground-subtle">
          {note}
        </div>
      )}
    </Card>
  );
}
