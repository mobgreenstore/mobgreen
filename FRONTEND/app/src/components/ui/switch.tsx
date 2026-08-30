"use client";

import {
  forwardRef,
  useId,
  type InputHTMLAttributes,
  type ReactNode,
} from "react";
import { cn } from "@/lib/utils";

interface SwitchProps extends Omit<
  InputHTMLAttributes<HTMLInputElement>,
  "type" | "role"
> {
  label: ReactNode;
  description?: ReactNode;
}

export const Switch = forwardRef<HTMLInputElement, SwitchProps>(
  ({ className, id, label, description, disabled, ...props }, ref) => {
    const generatedId = useId().replaceAll(":", "");
    const controlId = id ?? `switch-${generatedId}`;
    const labelId = `${controlId}-label`;
    const descriptionId = description ? `${controlId}-description` : undefined;

    return (
      <label
        htmlFor={controlId}
        className={cn(
          "flex min-h-14 items-start justify-between gap-4 rounded-md py-1",
          disabled ? "cursor-not-allowed opacity-55" : "cursor-pointer",
          className,
        )}
      >
        <span className="grid min-w-0 gap-0.5 pt-px">
          <span
            id={labelId}
            className="text-sm font-semibold tracking-[-0.01em] text-foreground"
          >
            {label}
          </span>
          {description && (
            <span
              id={descriptionId}
              className="text-[0.8125rem] leading-5 text-foreground-muted"
            >
              {description}
            </span>
          )}
        </span>
        <span className="relative mt-0.5 inline-flex h-7 w-12 shrink-0">
          <input
            ref={ref}
            id={controlId}
            type="checkbox"
            role="switch"
            disabled={disabled}
            aria-labelledby={labelId}
            aria-describedby={descriptionId}
            className="peer h-7 w-12 appearance-none rounded-full border border-border-strong bg-surface-subtle shadow-inner transition-colors checked:border-inverse checked:bg-inverse focus-visible:ring-3 focus-visible:ring-foreground/12 focus-visible:outline-none disabled:cursor-not-allowed"
            {...props}
          />
          <span className="pointer-events-none absolute top-1 left-1 size-5 rounded-full bg-white shadow-sm transition-transform peer-checked:translate-x-5 dark:bg-neutral-200" />
        </span>
      </label>
    );
  },
);

Switch.displayName = "Switch";
