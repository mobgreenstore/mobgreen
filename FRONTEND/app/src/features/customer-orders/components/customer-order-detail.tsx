"use client";

import Image from "next/image";
import Link from "next/link";
import { ImageIcon, LoaderCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { Money } from "@/components/commerce/money";
import { Badge, ErrorState, InlineAlert } from "@/components/ui";
import { CourierAssignmentCard } from "@/features/delivery-matching/components/courier-assignment-card";
import type { PublicOrderDetail } from "@/features/customer-orders/types";
import {
  OrderStatusBadge,
  PaymentStatusBadge,
} from "@/features/orders/components/status-badges";

export function CustomerOrderDetailView({
  reference,
  initialOrder = null,
}: {
  reference: string;
  initialOrder?: PublicOrderDetail | null;
}) {
  const [order, setOrder] = useState<PublicOrderDetail | null>(initialOrder);
  const [error, setError] = useState(false);
  useEffect(() => {
    if (initialOrder) return;
    fetch(`/api/customer/orders/${encodeURIComponent(reference)}`, {
      cache: "no-store",
    })
      .then(async (response) => {
        if (!response.ok) throw new Error();
        return (await response.json()) as { order: PublicOrderDetail };
      })
      .then((result) => setOrder(result.order))
      .catch(() => setError(true));
  }, [initialOrder, reference]);

  if (error)
    return (
      <ErrorState
        title="Order not found"
        description="This order is unavailable or is not linked to the current browser session."
      />
    );
  if (!order)
    return (
      <p
        role="status"
        className="flex items-center gap-2 text-sm text-foreground-muted"
      >
        <LoaderCircle className="size-4 animate-spin motion-reduce:animate-none" />
        Loading order…
      </p>
    );

  return (
    <div className="grid gap-6">
      <section className="rounded-xl bg-surface-subtle p-5">
        <div className="flex flex-wrap gap-2" aria-live="polite">
          <OrderStatusBadge status={order.status} />
          <PaymentStatusBadge status={order.paymentStatus} />
          <Badge>
            {order.fulfillmentType === "DELIVERY" ? "Delivery" : "Pickup"}
          </Badge>
        </div>
        <p className="mt-5 text-sm text-foreground-muted">Order total</p>
        <Money
          amountMinor={order.totalMinor}
          currency={order.currency}
          className="mt-1 block text-2xl font-semibold"
        />
        <time className="mt-2 block text-sm text-foreground-muted">
          Created{" "}
          {new Intl.DateTimeFormat("en", {
            dateStyle: "long",
            timeStyle: "short",
          }).format(new Date(order.createdAt))}
        </time>
      </section>

      {order.paymentStatus !== "PAID" && (
        <InlineAlert
          tone="info"
          title="Verification pending"
          description="The administrator must verify the submitted recharge before processing this order."
        />
      )}

      {order.deliveryLocation && (
        <section className="rounded-xl border border-border p-5">
          <h2 className="text-lg font-semibold">Delivery destination</h2>
          <p className="mt-2 text-sm leading-6 text-foreground-muted">
            {order.deliveryLocation.formattedAddress}
          </p>
          <p className="mt-1 text-xs text-foreground-subtle">
            {[
              order.deliveryLocation.postalCode,
              order.deliveryLocation.countryCode,
            ]
              .filter(Boolean)
              .join(" · ")}
          </p>
        </section>
      )}

      {order.courier && <CourierAssignmentCard courier={order.courier} />}

      <section>
        <h2 className="text-lg font-semibold">Items</h2>
        <div className="mt-3 grid gap-3">
          {order.items.map((item, index) => (
            <article
              key={`${item.name}-${index}`}
              className="grid grid-cols-[4.5rem_minmax(0,1fr)] gap-3 rounded-xl border border-border p-3 sm:grid-cols-[6rem_minmax(0,1fr)]"
            >
              <div className="relative aspect-square overflow-hidden rounded-lg bg-surface-subtle">
                {item.image ? (
                  <Image
                    src={item.image.url}
                    alt={item.image.altText}
                    fill
                    sizes="96px"
                    className="object-cover"
                  />
                ) : (
                  <div className="absolute inset-0 grid place-items-center text-foreground-subtle">
                    <ImageIcon aria-hidden="true" className="size-5" />
                    <span className="sr-only">Image unavailable</span>
                  </div>
                )}
              </div>
              <div className="flex min-w-0 justify-between gap-3">
                <div>
                  <h3 className="font-semibold">{item.name}</h3>
                  <p className="mt-1 text-sm text-foreground-muted">
                    {item.weightValue} {item.weightUnit.toLowerCase()} ×{" "}
                    {item.quantity}
                  </p>
                  <Money
                    amountMinor={item.unitPriceMinor}
                    currency={order.currency}
                    className="mt-2 block text-xs text-foreground-muted"
                  />
                </div>
                <Money
                  amountMinor={item.lineTotalMinor}
                  currency={order.currency}
                  className="font-semibold"
                />
              </div>
            </article>
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-lg font-semibold">Order progress</h2>
        <ol className="mt-4 grid">
          {order.timeline.map((event, index) => (
            <li
              key={`${event.status}-${event.createdAt}`}
              className="relative grid grid-cols-[1rem_1fr] gap-3 pb-5"
            >
              <span className="mt-1 size-3 rounded-full bg-foreground" />
              {index < order.timeline.length - 1 && (
                <span
                  aria-hidden="true"
                  className="absolute top-4 bottom-0 left-[0.34375rem] w-px bg-border"
                />
              )}
              <div>
                <p className="font-semibold capitalize">
                  {event.status.toLowerCase().replaceAll("_", " ")}
                </p>
                <time className="text-sm text-foreground-muted">
                  {new Intl.DateTimeFormat("en", {
                    dateStyle: "medium",
                    timeStyle: "short",
                  }).format(new Date(event.createdAt))}
                </time>
              </div>
            </li>
          ))}
        </ol>
      </section>

      {order.trackingAvailable && (
        <Link
          href={`/orders/${order.reference}/tracking`}
          className="inline-flex min-h-11 items-center justify-center rounded-md bg-inverse px-4 text-sm font-semibold text-inverse-foreground"
        >
          Track delivery
        </Link>
      )}
    </div>
  );
}
