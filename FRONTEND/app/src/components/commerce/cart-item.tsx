"use client";

import { Trash2 } from "lucide-react";
import { Money } from "@/components/commerce/money";
import { QuantityStepper } from "@/components/commerce/quantity-stepper";
import { ResponsiveImage } from "@/components/commerce/responsive-image";
import { WeightDisplay } from "@/components/commerce/weight-display";
import { IconButton } from "@/components/ui/icon-button";
import type { CartItemViewModel } from "@/types/commerce";

interface CartItemProps {
  item: CartItemViewModel;
  onQuantityChange: (quantity: number) => void;
  onRemove: () => void;
  disabled?: boolean;
}

export function CartItem({
  item,
  onQuantityChange,
  onRemove,
  disabled = false,
}: CartItemProps) {
  return (
    <article className="grid grid-cols-[5rem_1fr_auto] gap-3 border-b border-border py-4 sm:grid-cols-[6rem_1fr_auto]">
      <ResponsiveImage
        image={item.image}
        sizes="96px"
        className="rounded-md border border-border"
      />
      <div className="min-w-0">
        <h3 className="truncate text-sm font-semibold">{item.productName}</h3>
        <p className="mt-1 text-xs text-foreground-muted">
          <WeightDisplay
            value={item.option.weightValue}
            unit={item.option.weightUnit}
          />
        </p>
        <Money
          amountMinor={item.option.priceMinor * item.quantity}
          currency={item.option.currency}
          className="mt-2 block font-mono text-sm font-semibold"
        />
        <div className="mt-3">
          <QuantityStepper
            value={item.quantity}
            onChange={onQuantityChange}
            disabled={disabled}
            label={`Quantity for ${item.productName}`}
          />
        </div>
      </div>
      <IconButton
        aria-label={`Remove ${item.productName}`}
        size="small"
        disabled={disabled}
        onClick={onRemove}
        className="text-danger"
      >
        <Trash2 aria-hidden="true" className="size-4" />
      </IconButton>
    </article>
  );
}
