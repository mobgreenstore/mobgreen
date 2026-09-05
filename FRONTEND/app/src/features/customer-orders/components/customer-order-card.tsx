"use client";

import Link from "next/link";
import { Money } from "@/components/commerce/money";
import { ResponsiveImage } from "@/components/commerce/responsive-image";
import { Badge } from "@/components/ui";
import {
  CustomerOrderStatusBadge,
  CustomerPaymentStatusBadge,
} from "@/features/orders/components/status-badges";
import type { PublicOrderListItem } from "@/features/customer-orders/types";

export function CustomerOrderCard({ order }: { order: PublicOrderListItem }) {
  const extraItems = Math.max(0, order.itemCount - 1);
  return (
    <article
      aria-label={`Order ${order.reference}, ${order.status.toLowerCase().replaceAll("_", " ")}`}
      className="grid grid-cols-[5.5rem_minmax(0,1fr)] gap-4 rounded-xl border border-border bg-surface p-3 shadow-xs sm:grid-cols-[7rem_minmax(0,1fr)] sm:p-4"
    >
      <div className="relative aspect-square overflow-hidden rounded-lg bg-surface-subtle">
        <ResponsiveImage
          image={order.firstImage}
          sizes="(max-width: 640px) 88px, 112px"
          className="size-full"
        />
        {extraItems > 0 && (
          <span className="absolute right-1.5 bottom-1.5 rounded-full bg-black/75 px-2 py-1 text-[0.6875rem] font-semibold text-white">
            +{extraItems}
          </span>
        )}
      </div>
      <div className="min-w-0">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <p className="font-semibold tracking-[-0.02em]">
              {order.reference}
            </p>
            <time className="mt-1 block text-xs text-foreground-muted">
              {new Intl.DateTimeFormat("en", { dateStyle: "medium" }).format(
                new Date(order.createdAt),
              )}
            </time>
          </div>
          <Money
            amountMinor={order.totalMinor}
            currency={order.currency}
            className="font-semibold"
          />
        </div>
        <div className="mt-3 flex flex-wrap gap-2" aria-live="polite">
          <CustomerOrderStatusBadge status={order.status} />
          <CustomerPaymentStatusBadge status={order.paymentStatus} />
          <Badge>
            {order.fulfillmentType === "DELIVERY" ? "Delivery" : "Pickup"}
          </Badge>
        </div>
        {order.estimatedDelivery && (
          <p className="mt-3 text-sm text-foreground-muted">
            Estimated arrival: {order.estimatedDelivery}
          </p>
        )}
        <div className="mt-4 flex flex-wrap gap-4 text-sm font-semibold">
          <Link
            href={`/orders/${order.reference}`}
            className="underline underline-offset-4"
          >
            View order
          </Link>
          {order.trackingAvailable && (
            <Link
              href={`/orders/${order.reference}/tracking`}
              className="underline underline-offset-4"
            >
              View tracking
            </Link>
          )}
        </div>
      </div>
    </article>
  );
}
