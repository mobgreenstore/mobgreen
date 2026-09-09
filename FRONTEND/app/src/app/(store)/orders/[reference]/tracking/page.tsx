import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft, Clock3, MapPin } from "lucide-react";
import { useTranslations } from "next-intl";
import { Card, InlineAlert, buttonVariants } from "@/components/ui";
import { CustomerOrderTracking } from "@/features/customer-orders/components/customer-order-tracking";
import { CustomerOrderStatusBadge } from "@/features/orders/components/status-badges";
import {
  getEmailAccessibleOrder,
  getEmailAccessibleTracking,
  getGuestOrder,
  getGuestTracking,
} from "@/features/customer-orders/server/queries";
import { cn } from "@/lib/utils";
import { getServerOrderEmailAccess } from "@/features/customer-orders/server/order-email-access";
import { getServerGuestSession } from "@/server/guest-session";

export const dynamic = "force-dynamic";

function TrackingContent({ reference, tracking, order }: { reference: string; tracking: any; order: any }) {
  const t = useTranslations("OrderTracking");
  return (
    <main className="min-h-dvh bg-background pb-[max(2rem,env(safe-area-inset-bottom))]">
      <div className="mx-auto max-w-7xl px-3 pt-[max(0.75rem,env(safe-area-inset-top))] sm:px-6 sm:pt-6 lg:px-8">
        <div className="mb-3 flex items-end justify-between gap-4 sm:mb-5">
          <div>
            <Link
              href={`/orders/${encodeURIComponent(reference)}`}
              className="inline-flex min-h-10 items-center gap-1 text-sm font-semibold text-foreground-muted hover:text-foreground"
            >
              <ChevronLeft aria-hidden="true" className="size-4" />
              {t("backToOrder")}
            </Link>
            <p className="mt-1 text-xs font-semibold tracking-[0.08em] text-foreground-subtle uppercase">
              {t("mobGreensDelivery")}
            </p>
            <h1 className="mt-0.5 text-3xl font-semibold tracking-[-0.05em] sm:text-4xl">
              {t("trackOrder")}
            </h1>
          </div>
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
                    {t("trackingPreparing")}
                  </p>
                  <h2 className="mt-1 text-xl font-semibold tracking-[-0.03em]">
                    {t("routeNotLive")}
                  </h2>
                </div>
              </div>
              <CustomerOrderStatusBadge status={order.status} />
            </div>
            <p className="mt-5 max-w-xl text-sm leading-6 text-foreground-muted">
              {t("orderPreparing")}
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
              title={t("selectedProfileRetained")}
              description={
                order.courier
                  ? `${order.courier.displayName} ${t("profileRetained")}`
                  : t("profileWillBeSelected")
              }
            />
          </Card>
        )}
      </div>
    </main>
  );
}

export default async function TrackingPage({
  params,
}: {
  params: Promise<{ reference: string }>;
}) {
  const { reference } = await params;
  const guest = await getServerGuestSession();
  const emailAccess = await getServerOrderEmailAccess(reference);
  let order = guest ? await getGuestOrder(guest.id, reference) : null;
  if (!order && emailAccess) {
    order = await getEmailAccessibleOrder(reference);
  }
  if (!order || order.fulfillmentType !== "DELIVERY") notFound();
  let tracking = guest ? await getGuestTracking(guest.id, reference) : null;
  if (!tracking && emailAccess) {
    tracking = await getEmailAccessibleTracking(reference);
  }
  return <TrackingContent reference={reference} tracking={tracking} order={order} />;
}
