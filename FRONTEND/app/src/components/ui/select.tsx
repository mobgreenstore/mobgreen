"use client";

import { ChevronDown } from "lucide-react";
import { forwardRef, type SelectHTMLAttributes } from "react";
import { useFormField } from "@/components/ui/form-field";
import { cn } from "@/lib/utils";

export const Select = forwardRef<
  HTMLSelectElement,
  SelectHTMLAttributes<HTMLSelectElement>
>(({ className, id, disabled, required, children, ...props }, ref) => {
  const field = useFormField();
  const isDisabled = disabled ?? field?.disabled;
  const invalid = field?.invalid ?? false;
  const describedBy =
    [field?.descriptionId, field?.errorId].filter(Boolean).join(" ") ||
    undefined;

  return (
    <div className="relative">
      <select
        ref={ref}
        id={id ?? field?.controlId}
        disabled={isDisabled}
        required={required}
        aria-invalid={invalid || undefined}
        aria-describedby={describedBy}
        className={cn(
          "h-12 w-full appearance-none rounded-md border border-border-strong bg-surface pr-11 pl-3.5 text-base text-foreground shadow-xs transition-[border-color,box-shadow,background-color] hover:border-foreground-muted focus:border-foreground focus:ring-3 focus:ring-foreground/8 focus:outline-none disabled:cursor-not-allowed disabled:border-border disabled:bg-surface-subtle disabled:text-foreground-subtle",
          invalid &&
            "border-danger bg-danger-subtle/30 focus:border-danger focus:ring-danger/10",
          className,
        )}
        {...props}
      >
        {children}
      </select>
      <ChevronDown
        aria-hidden="true"
        className="pointer-events-none absolute top-1/2 right-3.5 size-4 -translate-y-1/2 text-foreground-muted"
        strokeWidth={1.8}
      />
    </div>
  );
});

Select.displayName = "Select";
