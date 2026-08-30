"use client";

import {
  createContext,
  useContext,
  useId,
  type HTMLAttributes,
  type LabelHTMLAttributes,
  type ReactNode,
} from "react";
import { AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface FormFieldContextValue {
  controlId: string;
  descriptionId?: string;
  errorId?: string;
  invalid: boolean;
  disabled: boolean;
}

const FormFieldContext = createContext<FormFieldContextValue | null>(null);

export function useFormField() {
  return useContext(FormFieldContext);
}

export interface FormFieldProps extends Omit<
  HTMLAttributes<HTMLDivElement>,
  "children"
> {
  children: ReactNode;
  id?: string;
  invalid?: boolean;
  disabled?: boolean;
  hasDescription?: boolean;
  hasError?: boolean;
}

export function FormField({
  children,
  className,
  id,
  invalid = false,
  disabled = false,
  hasDescription = false,
  hasError = false,
  ...props
}: FormFieldProps) {
  const generatedId = useId();
  const controlId = id ?? `field-${generatedId.replaceAll(":", "")}`;
  const context: FormFieldContextValue = {
    controlId,
    invalid: invalid || hasError,
    disabled,
    ...(hasDescription ? { descriptionId: `${controlId}-description` } : {}),
    ...(hasError ? { errorId: `${controlId}-error` } : {}),
  };

  return (
    <FormFieldContext.Provider value={context}>
      <div
        className={cn("grid min-w-0 gap-2", className)}
        data-invalid={context.invalid || undefined}
        data-disabled={disabled || undefined}
        {...props}
      >
        {children}
      </div>
    </FormFieldContext.Provider>
  );
}

export interface LabelProps extends LabelHTMLAttributes<HTMLLabelElement> {
  required?: boolean;
  optional?: boolean;
}

export function Label({
  className,
  htmlFor,
  children,
  required = false,
  optional = false,
  ...props
}: LabelProps) {
  const field = useFormField();

  return (
    <label
      className={cn(
        "flex min-h-5 items-baseline justify-between gap-3 text-sm font-semibold tracking-[-0.01em] text-foreground",
        field?.disabled && "text-foreground-subtle",
        className,
      )}
      htmlFor={htmlFor ?? field?.controlId}
      {...props}
    >
      <span>
        {children}
        {required && (
          <span aria-hidden="true" className="ml-1 text-danger">
            *
          </span>
        )}
      </span>
      {optional && (
        <span className="text-xs font-normal text-foreground-subtle">
          Optional
        </span>
      )}
    </label>
  );
}

export function FieldDescription({
  className,
  ...props
}: HTMLAttributes<HTMLParagraphElement>) {
  const field = useFormField();

  return (
    <p
      id={field?.descriptionId}
      className={cn(
        "text-[0.8125rem] leading-5 text-foreground-muted",
        className,
      )}
      {...props}
    />
  );
}

export function FieldError({
  className,
  children,
  ...props
}: HTMLAttributes<HTMLParagraphElement>) {
  const field = useFormField();
  if (!children) return null;

  return (
    <p
      id={field?.errorId}
      role="alert"
      className={cn(
        "flex items-start gap-1.5 text-[0.8125rem] leading-5 font-medium text-danger",
        className,
      )}
      {...props}
    >
      <AlertCircle
        aria-hidden="true"
        className="mt-0.5 size-3.5 shrink-0"
        strokeWidth={2}
      />
      <span>{children}</span>
    </p>
  );
}

export function FieldGroup({
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("grid gap-5 sm:grid-cols-2", className)} {...props} />
  );
}
