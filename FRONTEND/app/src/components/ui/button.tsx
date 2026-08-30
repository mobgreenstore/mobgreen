import { cva, type VariantProps } from "class-variance-authority";
import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export const buttonVariants = cva(
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-md px-4 text-sm font-semibold tracking-[-0.01em] transition-colors disabled:pointer-events-none disabled:opacity-45",
  {
    variants: {
      variant: {
        primary:
          "bg-inverse text-inverse-foreground hover:opacity-88 active:opacity-78",
        secondary:
          "border border-border-strong bg-surface text-foreground hover:bg-surface-subtle",
        ghost: "text-foreground hover:bg-surface-subtle",
        destructive:
          "bg-danger text-white hover:opacity-88 dark:text-neutral-950",
      },
      size: {
        default: "h-11",
        small: "h-9 min-h-9 px-3 text-[0.8125rem]",
        large: "h-12 px-5 text-base",
        icon: "size-11 min-h-11 px-0",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends
    ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

export function Button({
  className,
  variant,
  size,
  type = "button",
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={cn(buttonVariants({ variant, size }), className)}
      {...props}
    />
  );
}
