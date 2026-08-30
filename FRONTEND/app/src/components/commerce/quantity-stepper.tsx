"use client";

import { Minus, Plus } from "lucide-react";
import { IconButton } from "@/components/ui/icon-button";

interface QuantityStepperProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  disabled?: boolean;
  label?: string;
}

export function QuantityStepper({
  value,
  onChange,
  min = 1,
  max = 99,
  disabled = false,
  label = "Quantity",
}: QuantityStepperProps) {
  const safeValue = Math.min(Math.max(value, min), max);
  return (
    <div
      className="inline-flex h-11 items-center rounded-md border border-border bg-surface"
      role="group"
      aria-label={label}
    >
      <IconButton
        aria-label="Decrease quantity"
        size="small"
        disabled={disabled || safeValue <= min}
        onClick={() => onChange(safeValue - 1)}
        className="rounded-r-none"
      >
        <Minus aria-hidden="true" className="size-4" />
      </IconButton>
      <output
        aria-live="polite"
        aria-label={`${label}: ${safeValue}`}
        className="min-w-10 text-center font-mono text-sm font-semibold"
      >
        {safeValue}
      </output>
      <IconButton
        aria-label="Increase quantity"
        size="small"
        disabled={disabled || safeValue >= max}
        onClick={() => onChange(safeValue + 1)}
        className="rounded-l-none"
      >
        <Plus aria-hidden="true" className="size-4" />
      </IconButton>
    </div>
  );
}
