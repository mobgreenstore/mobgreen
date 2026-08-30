"use client";

import { Money } from "@/components/commerce/money";
import { WeightDisplay } from "@/components/commerce/weight-display";
import type { WeightPriceOption } from "@/types/commerce";
import { cn } from "@/lib/utils";

interface WeightPriceSelectorProps {
  options: readonly WeightPriceOption[];
  selectedId?: string;
  onSelectionChange?: (optionId: string) => void;
  name?: string;
  disabled?: boolean;
  label?: string;
}

export function WeightPriceSelector({
  options,
  selectedId,
  onSelectionChange,
  name = "weight-price",
  disabled = false,
  label = "Choose weight and price",
}: WeightPriceSelectorProps) {
  if (options.length === 0)
    return (
      <p className="text-sm text-foreground-muted">
        No purchasing options are available.
      </p>
    );

  return (
    <fieldset disabled={disabled}>
      <legend className="text-sm font-semibold">{label}</legend>
      <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
        {options.map((option) => (
          <label
            key={option.id}
            className={cn(
              "relative grid min-h-20 cursor-pointer content-center rounded-md border border-border bg-surface px-3 py-2.5 shadow-xs transition-colors has-checked:border-foreground has-checked:ring-1 has-checked:ring-foreground",
              !option.available && "cursor-not-allowed opacity-45",
            )}
          >
            <input
              type="radio"
              className="peer sr-only"
              name={name}
              value={option.id}
              checked={selectedId === option.id}
              disabled={!option.available}
              onChange={() => onSelectionChange?.(option.id)}
            />
            <WeightDisplay
              value={option.weightValue}
              unit={option.weightUnit}
              className="text-sm font-semibold"
            />
            <Money
              amountMinor={option.priceMinor}
              currency={option.currency}
              className="mt-1 font-mono text-xs text-foreground-muted"
            />
          </label>
        ))}
      </div>
    </fieldset>
  );
}
