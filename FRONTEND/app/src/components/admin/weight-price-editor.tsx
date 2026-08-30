"use client";

import { Plus, Trash2 } from "lucide-react";
import { useId } from "react";
import { CurrencySelect } from "@/components/commerce/currency-select";
import { Button } from "@/components/ui/button";
import { FormField, Label } from "@/components/ui/form-field";
import { IconButton } from "@/components/ui/icon-button";
import { Select } from "@/components/ui/select";
import { TextField } from "@/components/ui/text-field";
import type { SupportedCurrency, WeightUnit } from "@/config/commerce";
import { WEIGHT_UNITS } from "@/config/commerce";

export interface WeightPriceDraft {
  id: string;
  weightValue: string;
  weightUnit: WeightUnit;
  currency: SupportedCurrency;
  priceMajor: string;
  costMajor: string;
}

export interface WeightPriceEditorProps {
  options: readonly WeightPriceDraft[];
  onAdd: () => void;
  onUpdate: (
    id: string,
    changes: Partial<Omit<WeightPriceDraft, "id">>,
  ) => void;
  onRemove: (id: string) => void;
  disabled?: boolean;
}

export function WeightPriceEditor({
  options,
  onAdd,
  onUpdate,
  onRemove,
  disabled = false,
}: WeightPriceEditorProps) {
  const headingId = useId();

  return (
    <section aria-labelledby={headingId} className="grid gap-3">
      <div className="flex items-center justify-between gap-3">
        <h3 id={headingId} className="text-sm font-semibold">
          Weight and price options
        </h3>
        <Button
          variant="secondary"
          size="small"
          disabled={disabled}
          onClick={onAdd}
        >
          <Plus className="size-4" /> Add option
        </Button>
      </div>
      {options.length === 0 ? (
        <p className="rounded-md border border-dashed border-border p-5 text-center text-sm text-foreground-muted">
          Add at least one purchasable option.
        </p>
      ) : (
        <div className="grid gap-3">
          {options.map((option, index) => (
            <div
              key={option.id}
              className="grid gap-3 rounded-lg border border-border bg-surface p-4 sm:grid-cols-[1fr_1fr_1.25fr_auto] sm:items-end"
            >
              <FormField id={`weight-${option.id}`}>
                <Label>Weight</Label>
                <TextField
                  type="number"
                  min="0.001"
                  step="0.001"
                  inputMode="decimal"
                  value={option.weightValue}
                  disabled={disabled}
                  onChange={(event) =>
                    onUpdate(option.id, { weightValue: event.target.value })
                  }
                />
              </FormField>
              <FormField id={`unit-${option.id}`}>
                <Label>Unit</Label>
                <Select
                  value={option.weightUnit}
                  disabled={disabled}
                  onChange={(event) =>
                    onUpdate(option.id, {
                      weightUnit: event.target.value as WeightUnit,
                    })
                  }
                >
                  {WEIGHT_UNITS.map((unit) => (
                    <option key={unit.value} value={unit.value}>
                      {unit.label}
                    </option>
                  ))}
                </Select>
              </FormField>
              <div className="grid grid-cols-3 gap-2">
                <FormField id={`currency-${option.id}`}>
                  <Label>Currency</Label>
                  <CurrencySelect
                    value={option.currency}
                    disabled={disabled}
                    onChange={(event) =>
                      onUpdate(option.id, {
                        currency: event.target.value as SupportedCurrency,
                      })
                    }
                  />
                </FormField>
                <FormField id={`price-${option.id}`}>
                  <Label>Price</Label>
                  <TextField
                    type="number"
                    min="0"
                    step="0.01"
                    inputMode="decimal"
                    value={option.priceMajor}
                    disabled={disabled}
                    onChange={(event) =>
                      onUpdate(option.id, { priceMajor: event.target.value })
                    }
                  />
                </FormField>
                <FormField id={`cost-`} hasDescription>
                  <Label optional>Cost</Label>
                  <TextField
                    type="number"
                    min="0.01"
                    step="0.01"
                    inputMode="decimal"
                    value={option.costMajor}
                    placeholder="Private"
                    disabled={disabled}
                    onChange={(event) =>
                      onUpdate(option.id, { costMajor: event.target.value })
                    }
                  />
                </FormField>
              </div>
              <IconButton
                aria-label={`Remove option ${index + 1}`}
                disabled={disabled}
                onClick={() => onRemove(option.id)}
                className="text-danger"
              >
                <Trash2 className="size-4" />
              </IconButton>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
