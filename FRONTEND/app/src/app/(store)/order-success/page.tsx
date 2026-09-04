import type { Metadata } from "next";
import Link from "next/link";
import { CircleCheck, Clock3, MapPin, Navigation } from "lucide-react";
import { BrandLogo } from "@/components/shared/brand-mark";
import { StoreHeader } from "@/components/shared/store-header";
import { Card, InlineAlert, buttonVariants } from "@/components/ui";
import { OrderStatusBadge } from "@/features/orders/components/status-badges";
import { getGuestOrder } from "@/features/customer-orders/server/queries";
import { cn } from "@/lib/utils";
import { getServerGuestSession } from "@/server/guest-session";

export const metadata: Metadata = {
  title: "Order received",
  robots: { index: false, follow: false },
};

function distanceLabel(distanceMeters: number) {
  return distanceMeters < 1_000
    ? `${distanceMeters} m away`
    : `${(distanceMeters / 1_000).toFixed(1)} km away`;
}

function durationLabel(durationSeconds: number) {
  return `about ${Math.max(1, Math.ceil(durationSeconds / 60))} min`;
}

export default async function OrderSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ reference?: string }>;
}) {
  const reference = (await searchParams).reference?.trim() || "";
  const guest = await getServerGuestSession();
  const order =
    guest && reference ? await getGuestOrder(guest.id, reference) : null;

  return (
    <div className="min-h-dvh bg-background">
      <StoreHeader />
      <main className="mx-auto max-w-2xl px-4 py-10 sm:px-6 sm:py-16">
        <Card className="overflow-hidden p-0">
          <div className="border-b border-border bg-surface-subtle px-6 py-7 sm:px-9 sm:py-9">
            <div className="flex items-center justify-between gap-4">
              <BrandLogo
                alt="MOB GREENS"
                className="size-12 rounded-xl object-cover"
                priority
                sizes="48px"
              />
              {order ? <OrderStatusBadge status={order.status} /> : null}
            </div>
            <div className="mt-7 flex items-start gap-3">
              <span className="grid size-10 shrink-0 place-items-center rounded-full bg-success-subtle text-success">
                <CircleCheck aria-hidden="true" className="size-5" />
              </span>
              <div>
                <p className="text-xs font-semibold tracking-[0.1em] text-foreground-subtle uppercase">
                  {order ? "Order received" : "Order status"}
                </p>
                <h1 className="mt-1 text-3xl font-semibold tracking-[-0.05em] sm:text-4xl">
                  {order
                    ? "Your verification is in review."
                    : "We could not load that order."}
                </h1>
              </div>
            </div>
          </div>

          <div className="grid gap-6 px-6 py-7 sm:px-9 sm:py-9">
            {order ? (
              <>
                <p className="max-w-xl text-sm leading-6 text-foreground-muted">
                  Your order was submitted securely. We will email an update
                  when payment review changes. Delivery tracking is ready to
                  follow and the live map becomes available once dispatch
                  begins.
                </p>

                <div className="flex flex-wrap items-end justify-between gap-4 border-y border-border py-5">
                  <div>
                    <p className="text-xs font-semibold tracking-[0.1em] text-foreground-subtle uppercase">
                      Order reference
                    </p>
                    <p className="mt-2 font-mono text-lg font-semibold">
                      {order.reference}
                    </p>
                  </div>
                  <div className="text-left sm:text-right">
                    <p className="text-xs font-semibold tracking-[0.1em] text-foreground-subtle uppercase">
                      Payment
                    </p>
                    <p className="mt-2 flex items-center gap-1.5 font-semibold">
                      <Clock3 aria-hidden="true" className="size-4 text-info" />
                      Pending verification
                    </p>
                  </div>
                </div>

                {order.fulfillmentType === "DELIVERY" && (
                  <section className="grid gap-3 border-b border-border pb-6">
                    <div className="flex items-start gap-3">
                      <MapPin
                        aria-hidden="true"
                        className="mt-0.5 size-5 shrink-0 text-info"
                      />
                      <div>
                        <h2 className="font-semibold">Delivery and tracking</h2>
                        <p className="mt-1 text-sm leading-6 text-foreground-muted">
                          {order.deliveryLocation?.formattedAddress ??
                            "Confirmed delivery location"}
                        </p>
                      </div>
                    </div>
                    {order.courier && (
                      <p className="ml-8 text-sm text-foreground-muted">
                        {order.courier.displayName} is your selected nearby
                        delivery profile ·{" "}
                        {distanceLabel(order.courier.distanceMeters)} ·{" "}
                        {durationLabel(order.courier.estimatedDurationSeconds)}.
                      </p>
                    )}
                  </section>
                )}

                <InlineAlert
                  tone="info"
                  title="What happens next"
                  description="Payment review comes first. After confirmation, your delivery profile and destination are used for dispatch. The tracking page refreshes automatically once a route is available."
                />

                <div className="grid gap-3 sm:grid-cols-2">
                  <Link
                    href={`/orders/${encodeURIComponent(order.reference)}`}
                    className={cn(buttonVariants({ size: "large" }), "w-full")}
                  >
                    View order
                  </Link>
                  {order.fulfillmentType === "DELIVERY" ? (
                    <Link
                      href={`/orders/${encodeURIComponent(order.reference)}/tracking`}
                      className={cn(
                        buttonVariants({ variant: "secondary", size: "large" }),
                        "w-full",
                      )}
                    >
                      <Navigation aria-hidden="true" className="size-4" />
                      View tracking
                    </Link>
                  ) : (
                    <Link
                      href="/"
                      className={cn(
                        buttonVariants({ variant: "secondary", size: "large" }),
                        "w-full",
                      )}
                    >
                      Continue shopping
                    </Link>
                  )}
                </div>
              </>
            ) : (
              <>
                <InlineAlert
                  tone="info"
                  title="Open orders are private to this browser"
                  description="Use the same browser/device that placed the order, or start a new secure checkout from the store."
                />
                <Link
                  href="/"
                  className={cn(buttonVariants({ size: "large" }), "w-full")}
                >
                  Shop the store
                </Link>
              </>
            )}
          </div>
        </Card>
      </main>
    </div>
  );
}
