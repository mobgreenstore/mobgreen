import type { HTMLAttributes } from "react";
import { Badge } from "@/components/ui/badge";

export type Status =
  | "pending"
  | "confirmed"
  | "processing"
  | "ready"
  | "completed"
  | "cancelled"
  | "unpaid"
  | "paid"
  | "draft"
  | "active"
  | "archived";

const statusConfig: Record<
  Status,
  { label: string; tone: "neutral" | "info" | "success" | "danger" }
> = {
  pending: { label: "Pending", tone: "neutral" },
  confirmed: { label: "Confirmed", tone: "info" },
  processing: { label: "Processing", tone: "info" },
  ready: { label: "Ready", tone: "info" },
  completed: { label: "Completed", tone: "success" },
  cancelled: { label: "Cancelled", tone: "danger" },
  unpaid: { label: "Unpaid", tone: "neutral" },
  paid: { label: "Paid", tone: "success" },
  draft: { label: "Draft", tone: "neutral" },
  active: { label: "Active", tone: "success" },
  archived: { label: "Archived", tone: "danger" },
};

interface StatusBadgeProps extends Omit<
  HTMLAttributes<HTMLSpanElement>,
  "children"
> {
  status: Status;
  label?: string;
}

export function StatusBadge({ status, label, ...props }: StatusBadgeProps) {
  const config = statusConfig[status];
  return (
    <Badge tone={config.tone} {...props}>
      <span
        aria-hidden="true"
        className="mr-1.5 size-1.5 rounded-full bg-current"
      />
      {label ?? config.label}
    </Badge>
  );
}
