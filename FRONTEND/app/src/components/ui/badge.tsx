import { cva, type VariantProps } from "class-variance-authority";
import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex min-h-6 items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold",
  {
    variants: {
      tone: {
        neutral: "border-border bg-surface-subtle text-foreground-muted",
        info: "border-transparent bg-info-subtle text-info",
        success: "border-transparent bg-success-subtle text-success",
        danger: "border-transparent bg-danger-subtle text-danger",
      },
    },
    defaultVariants: { tone: "neutral" },
  },
);

interface BadgeProps
  extends HTMLAttributes<HTMLSpanElement>, VariantProps<typeof badgeVariants> {}

export function Badge({ className, tone, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ tone }), className)} {...props} />;
}
