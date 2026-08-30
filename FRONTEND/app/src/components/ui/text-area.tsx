"use client";

import { forwardRef, type TextareaHTMLAttributes } from "react";
import { useFormField } from "@/components/ui/form-field";
import { cn } from "@/lib/utils";

export const TextArea = forwardRef<
  HTMLTextAreaElement,
  TextareaHTMLAttributes<HTMLTextAreaElement>
>(({ className, id, disabled, required, rows = 5, ...props }, ref) => {
  const field = useFormField();
  const isDisabled = disabled ?? field?.disabled;
  const invalid = field?.invalid ?? false;
  const describedBy =
    [field?.descriptionId, field?.errorId].filter(Boolean).join(" ") ||
    undefined;

  return (
    <textarea
      ref={ref}
      id={id ?? field?.controlId}
      disabled={isDisabled}
      required={required}
      rows={rows}
      aria-invalid={invalid || undefined}
      aria-describedby={describedBy}
      className={cn(
        "min-h-28 w-full resize-y rounded-md border border-border-strong bg-surface px-3.5 py-3 text-base leading-6 text-foreground shadow-xs transition-[border-color,box-shadow,background-color] placeholder:text-foreground-subtle hover:border-foreground-muted focus:border-foreground focus:ring-3 focus:ring-foreground/8 focus:outline-none disabled:cursor-not-allowed disabled:border-border disabled:bg-surface-subtle disabled:text-foreground-subtle",
        invalid &&
          "border-danger bg-danger-subtle/30 focus:border-danger focus:ring-danger/10",
        className,
      )}
      {...props}
    />
  );
});

TextArea.displayName = "TextArea";
