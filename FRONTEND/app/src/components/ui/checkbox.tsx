"use client";

import { Check } from "lucide-react";
import {
  forwardRef,
  useId,
  type InputHTMLAttributes,
  type ReactNode,
} from "react";
import { cn } from "@/lib/utils";

interface CheckboxProps extends Omit<
  InputHTMLAttributes<HTMLInputElement>,
  "type"
> {
  label: ReactNode;
  description?: ReactNode;
}

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, id, label, description, disabled, ...props }, ref) => {
    const generatedId = useId().replaceAll(":", "");
    const controlId = id ?? `checkbox-${generatedId}`;
    const labelId = `${controlId}-label`;
    const descriptionId = description ? `${controlId}-description` : undefined;

    return (
      <label
        htmlFor={controlId}
        className={cn(
          "group flex min-h-11 items-start gap-3 rounded-md py-1 text-sm",
          disabled ? "cursor-not-allowed opacity-55" : "cursor-pointer",
          className,
        )}
      >
        <span className="relative mt-0.5 grid size-5 shrink-0 place-items-center">
          <input
            ref={ref}
            id={controlId}
            type="checkbox"
            disabled={disabled}
            aria-labelledby={labelId}
            aria-describedby={descriptionId}
            className="peer size-5 appearance-none rounded-sm border border-border-strong bg-surface shadow-xs transition-[border-color,background-color,box-shadow] checked:border-inverse checked:bg-inverse hover:border-foreground-muted focus-visible:ring-3 focus-visible:ring-foreground/12 focus-visible:outline-none disabled:cursor-not-allowed"
            {...props}
          />
          <Check
            aria-hidden="true"
            className="pointer-events-none absolute size-3.5 text-inverse-foreground opacity-0 peer-checked:opacity-100"
            strokeWidth={2.5}
          />
        </span>
        <span className="grid min-w-0 gap-0.5 pt-px">
          <span
            id={labelId}
            className="font-semibold tracking-[-0.01em] text-foreground"
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
      </label>
    );
  },
);

Checkbox.displayName = "Checkbox";
