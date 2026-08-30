"use client";

import { LoaderCircle } from "lucide-react";
import { forwardRef, type InputHTMLAttributes, type ReactNode } from "react";
import { useFormField } from "@/components/ui/form-field";
import { cn } from "@/lib/utils";

interface TextFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  leading?: ReactNode;
  trailing?: ReactNode;
  loading?: boolean;
}

export const TextField = forwardRef<HTMLInputElement, TextFieldProps>(
  (
    {
      className,
      id,
      disabled,
      required,
      readOnly,
      leading,
      trailing,
      loading = false,
      ...props
    },
    ref,
  ) => {
    const field = useFormField();
    const isDisabled = disabled ?? field?.disabled;
    const invalid = field?.invalid ?? false;
    const describedBy =
      [field?.descriptionId, field?.errorId].filter(Boolean).join(" ") ||
      undefined;
    const endAdornment = loading ? (
      <LoaderCircle
        aria-hidden="true"
        className="size-4 animate-spin motion-reduce:animate-none"
      />
    ) : (
      trailing
    );

    return (
      <div className="relative">
        {leading && (
          <span className="pointer-events-none absolute inset-y-0 left-0 grid w-11 place-items-center text-foreground-muted">
            {leading}
          </span>
        )}
        <input
          ref={ref}
          id={id ?? field?.controlId}
          disabled={isDisabled || loading}
          required={required}
          readOnly={readOnly}
          aria-invalid={invalid || undefined}
          aria-describedby={describedBy}
          aria-busy={loading || undefined}
          className={cn(
            "h-12 w-full rounded-md border border-border-strong bg-surface px-3.5 text-base text-foreground shadow-xs transition-[border-color,box-shadow,background-color] placeholder:text-foreground-subtle read-only:bg-surface-subtle/60 hover:border-foreground-muted focus:border-foreground focus:ring-3 focus:ring-foreground/8 focus:outline-none disabled:cursor-not-allowed disabled:border-border disabled:bg-surface-subtle disabled:text-foreground-subtle",
            invalid &&
              "border-danger bg-danger-subtle/30 focus:border-danger focus:ring-danger/10",
            leading && "pl-11",
            endAdornment && "pr-11",
            className,
          )}
          {...props}
        />
        {endAdornment && (
          <span className="absolute inset-y-0 right-0 grid min-w-11 place-items-center text-foreground-muted">
            {endAdornment}
          </span>
        )}
      </div>
    );
  },
);

TextField.displayName = "TextField";
