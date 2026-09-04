"use client";

import { InlineAlert } from "@/components/ui";
import { PaymentMethodGlyph } from "@/features/payments/components/payment-method-glyph";
import type { PaymentMethodId } from "@/features/payments/payment-method";
import { cn } from "@/lib/utils";

type PaymentMethodSelectorProps = {
  value: PaymentMethodId;
  bitcoinAvailable: boolean;
  onChange: (value: PaymentMethodId) => void;
};

const choices: Array<{
  id: PaymentMethodId;
  title: string;
  description: string;
}> = [
  {
    id: "RECHARGE_FROM_STORE",
    title: "Recharge from store",
    description: "Use a code bought in person.",
  },
  {
    id: "RECHARGE_ONLINE",
    title: "Recharge online",
    description: "Buy a code from a listed partner.",
  },
  {
    id: "BITCOIN_DEPOSIT",
    title: "Bitcoin — 50% deposit",
    description: "50% now, rest cash.",
  },
];

export function PaymentMethodSelector({
  value,
  bitcoinAvailable,
  onChange,
}: PaymentMethodSelectorProps) {
  return (
    <div>
      <fieldset>
        <legend className="text-sm font-semibold tracking-[-0.01em] text-foreground">
          Choose how you want to pay
        </legend>
        <div className="-mx-1 mt-3 flex snap-x gap-2 overflow-x-auto px-1 pb-2 sm:mx-0 sm:grid sm:grid-cols-3 sm:overflow-visible sm:px-0 sm:pb-0">
          {choices.map((choice) => {
            const disabled =
              choice.id === "BITCOIN_DEPOSIT" && !bitcoinAvailable;
            const selected = choice.id === value;
            return (
              <label
                key={choice.id}
                className={cn(
                  "group flex min-h-32 min-w-[11.25rem] flex-1 snap-start flex-col justify-between rounded-xl border border-border bg-surface p-4 transition-[border-color,background-color,box-shadow,transform] focus-within:ring-2 focus-within:ring-foreground/18 hover:border-border-strong has-checked:border-foreground has-checked:bg-surface-subtle has-checked:shadow-sm sm:min-w-0",
                  disabled
                    ? "cursor-not-allowed opacity-45"
                    : "cursor-pointer hover:-translate-y-px",
                )}
              >
                <input
                  type="radio"
                  name="paymentMethod"
                  value={choice.id}
                  checked={selected}
                  disabled={disabled}
                  onChange={() => onChange(choice.id)}
                  className="sr-only"
                />
                <div className="flex items-start justify-between gap-3">
                  <PaymentMethodGlyph
                    method={choice.id}
                    className={cn(
                      "size-7 text-foreground-muted transition-colors",
                      selected && "text-foreground",
                    )}
                  />
                  {selected ? (
                    <span className="text-[0.6875rem] font-bold tracking-[0.08em] text-foreground-subtle uppercase">
                      Selected
                    </span>
                  ) : null}
                </div>
                <div className="mt-5">
                  <p className="text-sm font-semibold tracking-[-0.015em]">
                    {choice.title}
                  </p>
                  <p className="mt-1 text-xs leading-5 text-foreground-muted">
                    {disabled
                      ? "Secure invoice setup pending."
                      : choice.description}
                  </p>
                </div>
              </label>
            );
          })}
        </div>
      </fieldset>

      {value === "BITCOIN_DEPOSIT" && (
        <InlineAlert
          className="mt-4"
          tone="info"
          title="Pay half to confirm"
          description="Pay 50% of the confirmed order total in Bitcoin. The remaining balance is collected in cash at delivery."
        />
      )}
    </div>
  );
}
