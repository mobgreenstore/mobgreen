import { AlertCircle, CheckCircle2, Info, XCircle } from "lucide-react";
import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";

type AlertTone = "neutral" | "info" | "success" | "danger";

interface InlineAlertProps extends Omit<
  HTMLAttributes<HTMLDivElement>,
  "title"
> {
  title: ReactNode;
  description?: ReactNode;
  tone?: AlertTone;
}

const icons = {
  neutral: AlertCircle,
  info: Info,
  success: CheckCircle2,
  danger: XCircle,
};

export function InlineAlert({
  title,
  description,
  tone = "neutral",
  className,
  ...props
}: InlineAlertProps) {
  const Icon = icons[tone];

  return (
    <div
      role={tone === "danger" ? "alert" : "status"}
      className={cn(
        "grid grid-cols-[auto_1fr] gap-3 rounded-md border p-4",
        tone === "neutral" && "border-border bg-surface-subtle",
        tone === "info" && "border-info/25 bg-info-subtle text-info",
        tone === "success" &&
          "border-success/25 bg-success-subtle text-success",
        tone === "danger" && "border-danger/25 bg-danger-subtle text-danger",
        className,
      )}
      {...props}
    >
      <Icon aria-hidden="true" className="mt-0.5 size-5" strokeWidth={1.9} />
      <div className="min-w-0">
        <p className="text-sm font-semibold text-current">{title}</p>
        {description && (
          <div className="mt-1 text-[0.8125rem] leading-5 text-current opacity-80">
            {description}
          </div>
        )}
      </div>
    </div>
  );
}
