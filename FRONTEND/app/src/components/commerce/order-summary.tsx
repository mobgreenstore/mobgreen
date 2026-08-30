import { Money } from "@/components/commerce/money";
import type { SupportedCurrency } from "@/config/commerce";
import { cn } from "@/lib/utils";

interface OrderSummaryProps {
  currency: SupportedCurrency;
  subtotalMinor: number;
  deliveryFeeMinor?: number;
  totalMinor: number;
  className?: string;
}

export function OrderSummary({
  currency,
  subtotalMinor,
  deliveryFeeMinor = 0,
  totalMinor,
  className,
}: OrderSummaryProps) {
  return (
    <section
      aria-labelledby="order-summary-title"
      className={cn(
        "rounded-lg border border-border bg-surface p-5 shadow-xs",
        className,
      )}
    >
      <h2 id="order-summary-title" className="font-semibold tracking-[-0.02em]">
        Order summary
      </h2>
      <dl className="mt-5 grid gap-3 text-sm">
        <div className="flex justify-between gap-4">
          <dt className="text-foreground-muted">Subtotal</dt>
          <dd className="font-mono">
            <Money amountMinor={subtotalMinor} currency={currency} />
          </dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-foreground-muted">Delivery</dt>
          <dd className="font-mono">
            <Money amountMinor={deliveryFeeMinor} currency={currency} />
          </dd>
        </div>
        <div className="mt-1 flex justify-between gap-4 border-t border-border pt-4 text-base font-semibold">
          <dt>Total</dt>
          <dd className="font-mono">
            <Money amountMinor={totalMinor} currency={currency} />
          </dd>
        </div>
      </dl>
    </section>
  );
}
