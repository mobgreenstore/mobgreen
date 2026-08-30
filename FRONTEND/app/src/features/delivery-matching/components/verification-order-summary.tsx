import { MapPin, Package, UserRound } from "lucide-react";
import {
  Money,
  OrderSummary,
  ResponsiveImage,
  WeightDisplay,
} from "@/components/commerce";
import { Badge, Card } from "@/components/ui";
import type { CheckoutConfirmationView } from "@/features/delivery-matching/types";

export function VerificationOrderSummary({
  intent,
}: {
  intent: CheckoutConfirmationView;
}) {
  return (
    <div className="grid gap-4">
      <Card className="p-5">
        <div className="flex items-center gap-2">
          <Package
            aria-hidden="true"
            className="size-4 text-foreground-muted"
          />
          <h2 className="font-semibold">Your items</h2>
          <span className="ml-auto text-xs font-semibold text-foreground-subtle">
            {intent.itemCount} total
          </span>
        </div>
        <div className="mt-4 grid gap-4">
          {intent.lines.map((line) => (
            <article
              key={line.key}
              className="grid grid-cols-[3.5rem_1fr_auto] gap-3"
            >
              <ResponsiveImage
                image={line.image}
                sizes="56px"
                className="size-14 rounded-md"
              />
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold">
                  {line.productName}
                </p>
                <p className="mt-1 text-xs text-foreground-muted">
                  <WeightDisplay
                    value={line.weightValue}
                    unit={line.weightUnit}
                  />{" "}
                  · Qty {line.quantity}
                </p>
                {line.discountBps !== null && (
                  <Badge tone="success" className="mt-1">
                    {(line.discountBps / 100).toFixed(0)}% offer
                  </Badge>
                )}
              </div>
              <p className="text-sm font-semibold">
                <Money
                  amountMinor={line.lineTotalMinor}
                  currency={intent.currency}
                />
              </p>
            </article>
          ))}
        </div>
      </Card>

      <Card className="grid gap-4 p-5 text-sm">
        <div className="flex gap-3">
          <UserRound
            aria-hidden="true"
            className="mt-0.5 size-4 shrink-0 text-foreground-muted"
          />
          <div className="min-w-0">
            <p className="font-semibold">{intent.customer.name}</p>
            <p className="truncate text-foreground-muted">
              {intent.customer.email}
            </p>
          </div>
        </div>
        {intent.location && (
          <div className="flex gap-3">
            <MapPin
              aria-hidden="true"
              className="mt-0.5 size-4 shrink-0 text-foreground-muted"
            />
            <div>
              <p className="font-semibold">Delivery location</p>
              <p className="mt-1 leading-5 text-foreground-muted">
                {intent.location.formattedAddress}
              </p>
            </div>
          </div>
        )}
      </Card>

      <OrderSummary
        currency={intent.currency}
        subtotalMinor={intent.subtotalMinor}
        totalMinor={intent.subtotalMinor}
      />
    </div>
  );
}
