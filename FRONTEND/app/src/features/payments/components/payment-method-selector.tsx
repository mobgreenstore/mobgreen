"use client";

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
  shortLabel: string;
  title: string;
  description: string;
}> = [
  {
    id: "RECHARGE_FROM_STORE",
    shortLabel: "Store",
    title: "Recharge from store",
    description: "Use a code bought in person.",
  },
  {
    id: "RECHARGE_ONLINE",
    shortLabel: "Online",
    title: "Recharge online",
    description: "Buy a code from a listed partner.",
  },
  {
    id: "BITCOIN_DEPOSIT",
    shortLabel: "Bitcoin",
    title: "Bitcoin — 50% deposit",
    description: "50% now, rest cash.",
  },
];

export function PaymentMethodSelector({
  value,
  bitcoinAvailable,
  onChange,
}: PaymentMethodSelectorProps) {
  const selectedChoice =
    choices.find((choice) => choice.id === value) ?? choices[0]!;
  const bitcoinSelected = selectedChoice.id === "BITCOIN_DEPOSIT";

  return (
    <fieldset
      className="min-w-0"
      aria-describedby="payment-method-selection-detail"
    >
      <legend className="sr-only">Payment method</legend>
      <div className="grid grid-cols-3 gap-1 rounded-xl border border-border bg-surface-subtle p-1">
        {choices.map((choice) => {
          const disabled = choice.id === "BITCOIN_DEPOSIT" && !bitcoinAvailable;
          const selected = choice.id === value;

          return (
            <label
              key={choice.id}
              className={cn(
                "flex min-h-16 min-w-0 flex-col items-center justify-center gap-1.5 rounded-lg px-1.5 text-center text-xs font-semibold transition-[background-color,box-shadow,color,opacity] focus-within:ring-2 focus-within:ring-foreground/20 xs:flex-row xs:text-sm",
                selected
                  ? "bg-surface text-foreground shadow-sm"
                  : "text-foreground-muted",
                disabled
                  ? "cursor-not-allowed opacity-40"
                  : "cursor-pointer hover:text-foreground",
              )}
            >
              <input
                type="radio"
                name="paymentMethod"
                value={choice.id}
                checked={selected}
                disabled={disabled}
                onChange={() => onChange(choice.id)}
                aria-label={choice.title}
                className="sr-only"
              />
              <PaymentMethodGlyph
                method={choice.id}
                className="size-5 shrink-0"
              />
              <span className="min-w-0 truncate">{choice.shortLabel}</span>
            </label>
          );
        })}
      </div>

      <div
        id="payment-method-selection-detail"
        className="mt-3 border-l-2 border-info pl-3"
      >
        <p className="text-sm font-semibold">{selectedChoice.title}</p>
        <p className="mt-0.5 text-sm leading-6 text-foreground-muted">
          {bitcoinSelected && !bitcoinAvailable
            ? "Secure invoice setup pending."
            : selectedChoice.description}
        </p>
        {bitcoinSelected && bitcoinAvailable ? (
          <p className="mt-1 text-xs leading-5 text-foreground-muted">
            Pay 50% of the confirmed order total in Bitcoin. The remaining
            balance is collected in cash at delivery.
          </p>
        ) : null}
      </div>
    </fieldset>
  );
}
