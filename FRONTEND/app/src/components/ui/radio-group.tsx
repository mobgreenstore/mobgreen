"use client";

import {
  createContext,
  forwardRef,
  useContext,
  useId,
  type FieldsetHTMLAttributes,
  type InputHTMLAttributes,
  type ReactNode,
} from "react";
import { cn } from "@/lib/utils";

interface RadioGroupContextValue {
  name: string;
  disabled: boolean;
}

const RadioGroupContext = createContext<RadioGroupContextValue | null>(null);

interface RadioGroupProps extends FieldsetHTMLAttributes<HTMLFieldSetElement> {
  legend: ReactNode;
  description?: ReactNode;
  orientation?: "vertical" | "horizontal";
}

export function RadioGroup({
  legend,
  description,
  orientation = "vertical",
  disabled = false,
  className,
  children,
  ...props
}: RadioGroupProps) {
  const generatedName = useId().replaceAll(":", "");
  const name = props.name ?? `radio-${generatedName}`;
  const descriptionId = description ? `${name}-description` : undefined;

  return (
    <RadioGroupContext.Provider value={{ name, disabled }}>
      <fieldset
        disabled={disabled}
        aria-describedby={descriptionId}
        className={cn("min-w-0", disabled && "opacity-55", className)}
        {...props}
      >
        <legend className="text-sm font-semibold tracking-[-0.01em] text-foreground">
          {legend}
        </legend>
        {description && (
          <p
            id={descriptionId}
            className="mt-1 text-[0.8125rem] leading-5 text-foreground-muted"
          >
            {description}
          </p>
        )}
        <div
          className={cn(
            "mt-3 grid gap-2",
            orientation === "horizontal" && "sm:grid-cols-2",
          )}
        >
          {children}
        </div>
      </fieldset>
    </RadioGroupContext.Provider>
  );
}

interface RadioOptionProps extends Omit<
  InputHTMLAttributes<HTMLInputElement>,
  "type" | "name"
> {
  label: ReactNode;
  description?: ReactNode;
}

export const RadioOption = forwardRef<HTMLInputElement, RadioOptionProps>(
  ({ className, id, value, label, description, disabled, ...props }, ref) => {
    const group = useContext(RadioGroupContext);
    if (!group) throw new Error("RadioOption must be used inside RadioGroup");
    const optionId = id ?? `${group.name}-${String(value)}`;
    const isDisabled = disabled ?? group.disabled;
    const labelId = `${optionId}-label`;
    const descriptionId = description ? `${optionId}-description` : undefined;

    return (
      <label
        htmlFor={optionId}
        className={cn(
          "group relative flex min-h-14 items-start gap-3 rounded-md border border-border bg-surface p-3.5 shadow-xs transition-[border-color,background-color,box-shadow] hover:border-border-strong has-checked:border-foreground has-checked:ring-1 has-checked:ring-foreground",
          isDisabled ? "cursor-not-allowed" : "cursor-pointer",
          className,
        )}
      >
        <span className="relative mt-0.5 grid size-5 shrink-0 place-items-center">
          <input
            ref={ref}
            id={optionId}
            type="radio"
            name={group.name}
            value={value}
            disabled={isDisabled}
            aria-labelledby={labelId}
            aria-describedby={descriptionId}
            className="peer size-5 appearance-none rounded-full border border-border-strong bg-surface transition-[border-color,box-shadow] checked:border-[6px] checked:border-inverse focus-visible:ring-3 focus-visible:ring-foreground/12 focus-visible:outline-none"
            {...props}
          />
        </span>
        <span className="grid min-w-0 gap-0.5">
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
      </label>
    );
  },
);

RadioOption.displayName = "RadioOption";
