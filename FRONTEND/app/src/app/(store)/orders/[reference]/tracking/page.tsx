import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft, Clock3, MapPin } from "lucide-react";
import { Card, InlineAlert, buttonVariants } from "@/components/ui";
import { CustomerOrderTracking } from "@/features/customer-orders/components/customer-order-tracking";
import { OrderStatusBadge } from "@/features/orders/components/status-badges";
import {
  getGuestOrder,
  getGuestTracking,
} from "@/features/customer-orders/server/queries";
import { cn } from "@/lib/utils";
import { getServerGuestSession } from "@/server/guest-session";

export const dynamic = "force-dynamic";

export default async function TrackingPage({
  params,
}: {
  params: Promise<{ reference: string }>;
}) {
  const { reference } = await params;
  const guest = await getServerGuestSession();
  if (!guest) notFound();
  const order = await getGuestOrder(guest.id, reference);
  if (!order || order.fulfillmentType !== "DELIVERY") notFound();
  const tracking = await getGuestTracking(guest.id, reference);

  return (
    <main className="mx-auto min-h-dvh max-w-5xl px-3 pt-[max(1rem,env(safe-area-inset-top))] pb-[max(2rem,env(safe-area-inset-bottom))] sm:px-6 sm:pt-8">
      <Link
        href={`/orders/${encodeURIComponent(reference)}`}
        className="inline-flex min-h-11 items-center gap-1 text-sm font-semibold underline underline-offset-4"
      >
        <ChevronLeft aria-hidden="true" className="size-4" />
        Back to order
      </Link>
      <div className="mt-4 mb-6">
        <p className="text-xs font-semibold tracking-[0.08em] text-foreground-subtle uppercase">
          MOB GREENS delivery
        </p>
        <h1 className="mt-1 text-3xl font-semibold tracking-[-0.05em]">
          Track your order
        </h1>
      </div>

      {tracking ? (
        <CustomerOrderTracking
          reference={reference}
          initialTracking={tracking}
        />
      ) : (
        <Card className="max-w-2xl p-5 sm:p-7">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <span className="grid size-10 place-items-center rounded-full bg-info-subtle text-info">
                <Clock3 aria-hidden="true" className="size-5" />
              </span>
              <div>
                <p className="text-xs font-semibold tracking-[0.08em] text-foreground-subtle uppercase">
                  Tracking preparing
                </p>
                <h2 className="mt-1 text-xl font-semibold tracking-[-0.03em]">
                  Your delivery route is not live yet.
                </h2>
              </div>
            </div>
            <OrderStatusBadge status={order.status} />
          </div>
          <p className="mt-5 max-w-xl text-sm leading-6 text-foreground-muted">
            Payment must be confirmed and the order dispatched before the Mapbox
            route can start. This page stays private to the browser that placed
            the order and becomes the live tracking page automatically once the
            route is available.
          </p>
          {order.deliveryLocation && (
            <div className="mt-5 flex items-start gap-3 border-t border-border pt-5 text-sm">
              <MapPin
                aria-hidden="true"
                className="mt-0.5 size-4 shrink-0 text-info"
              />
              <span>{order.deliveryLocation.formattedAddress}</span>
            </div>
          )}
          <InlineAlert
            className="mt-5"
            tone="info"
            title="Selected delivery profile retained"
            description={
              order.courier
                ? `${order.courier.displayName} remains selected for this order. We will notify you when dispatch begins.`
                : "A nearby delivery profile will be selected after payment confirmation."
            }
          />
          <Link
            href={`/orders/${encodeURIComponent(reference)}`}
            className={cn(buttonVariants({ variant: "secondary" }), "mt-6")}
          >
            View order details
          </Link>
        </Card>
      )}
    </main>
  );
}
