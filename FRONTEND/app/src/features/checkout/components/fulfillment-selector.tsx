"use client";

import { Store, Truck } from "lucide-react";
import { cn } from "@/lib/utils";

export type FulfillmentType = "PICKUP" | "DELIVERY";

const choices: Array<{
  id: FulfillmentType;
  label: string;
  description: string;
  icon: typeof Store;
}> = [
  {
    id: "PICKUP",
    label: "Pickup",
    description: "Collect your order after payment is confirmed.",
    icon: Store,
  },
  {
    id: "DELIVERY",
    label: "Delivery",
    description:
      "Confirm your location, then choose a nearby delivery profile in verification.",
    icon: Truck,
  },
];

export function FulfillmentSelector({
  value,
  onChange,
}: {
  value: FulfillmentType;
  onChange: (value: FulfillmentType) => void;
}) {
  const selected = choices.find((choice) => choice.id === value) ?? choices[0]!;

  return (
    <fieldset
      className="min-w-0"
      aria-describedby="fulfillment-selection-detail"
    >
      <legend className="sr-only">Choose pickup or delivery</legend>
      <div className="grid grid-cols-2 gap-1 rounded-xl border border-border bg-surface-subtle p-1">
        {choices.map((choice) => {
          const Icon = choice.icon;
          const checked = choice.id === value;

          return (
            <label
              key={choice.id}
              className={cn(
                "flex min-h-14 min-w-0 cursor-pointer items-center justify-center gap-2 rounded-lg px-3 text-sm font-semibold transition-[background-color,box-shadow,color] focus-within:ring-2 focus-within:ring-foreground/20",
                checked
                  ? "bg-surface text-foreground shadow-sm"
                  : "text-foreground-muted hover:text-foreground",
              )}
            >
              <input
                type="radio"
                name="fulfillmentType"
                value={choice.id}
                checked={checked}
                onChange={() => onChange(choice.id)}
                aria-label={choice.label}
                className="sr-only"
              />
              <Icon aria-hidden="true" className="size-5 shrink-0" />
              <span className="truncate">{choice.label}</span>
            </label>
          );
        })}
      </div>
      <p
        id="fulfillment-selection-detail"
        className="mt-3 text-sm leading-6 text-foreground-muted"
      >
        {selected.description}
      </p>
    </fieldset>
  );
}
