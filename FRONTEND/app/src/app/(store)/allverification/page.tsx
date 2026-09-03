import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, MapPin, PackageCheck, ShoppingBag } from "lucide-react";
import { Card, buttonVariants } from "@/components/ui";
import {
  CheckoutConfirmationRoute,
  confirmationMetadata,
} from "@/features/delivery-matching/components/checkout-confirmation-route";
import { CheckoutPageShell } from "@/features/delivery-matching/components/checkout-page-shell";
import { listGuestOrders } from "@/features/customer-orders/server/queries";
import {
  PaymentConfirmationShell,
  PaymentStatusTimeline,
} from "@/features/payments/components/payment-confirmation";
import { cn } from "@/lib/utils";
import { getServerGuestSession } from "@/server/guest-session";

export const metadata: Metadata = {
  ...confirmationMetadata,
  title: "Verification · MOB GREENS",
};

export default async function AllVerificationPage({
  searchParams,
}: {
  searchParams: Promise<{ intent?: string }>;
}) {
  const params = await searchParams;
  if (params.intent)
    return <CheckoutConfirmationRoute searchParams={Promise.resolve(params)} />;
  const guest = await getServerGuestSession();
  const resumableOrders = guest
    ? await Promise.all([
        listGuestOrders(guest.id, 1, "pending"),
        listGuestOrders(guest.id, 1, "active"),
      ])
        .then(([pending, active]) =>
          [...pending.orders, ...active.orders].slice(0, 3),
        )
        .catch(() => [])
    : [];
  return (
    <CheckoutPageShell label="Verification">
      <PaymentConfirmationShell
        title="Verify an order, when you are ready."
        description="Use this page to continue a checkout or reopen an order from this browser. Delivery matching and tracking are activated only after payment and location are confirmed."
        aside={
          <>
            <Card className="p-5">
              <PaymentStatusTimeline state="READY" />
            </Card>
            <Card className="p-5">
              <p className="text-sm font-semibold">Delivery and tracking</p>
              <p className="mt-2 text-sm leading-6 text-foreground-muted">
                Open a paid delivery order, confirm its location, then choose a
                nearby delivery profile. Tracking starts after that selection.
              </p>
            </Card>
          </>
        }
      >
        <div className="grid gap-5">
          <Card className="border-info/20 bg-info-subtle/40 p-4">
            <p className="text-sm leading-6 text-foreground-muted">
              No checkout is open right now.{" "}
              <Link
                href="/"
                className="font-bold text-info underline underline-offset-4"
              >
                Shop here
              </Link>{" "}
              to add products and begin a new verification.
            </p>
          </Card>
          <Card className="p-5 sm:p-6">
            <div className="flex items-start gap-3">
              <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-surface-subtle text-foreground">
                <PackageCheck aria-hidden="true" className="size-5" />
              </div>
              <div>
                <p className="text-xs font-bold tracking-[0.12em] text-foreground-subtle uppercase">
                  Existing order
                </p>
                <h2 className="mt-1 text-xl font-black tracking-tight">
                  Continue from this device
                </h2>
                <p className="mt-2 text-sm leading-6 text-foreground-muted">
                  Only orders linked to this browser are shown. Open one to
                  review payment, choose a nearby delivery profile when
                  eligible, or track it.
                </p>
              </div>
            </div>
            {resumableOrders.length > 0 ? (
              <div className="mt-5 grid gap-2">
                {resumableOrders.map((order) => (
                  <Link
                    key={order.reference}
                    href={`/orders/${encodeURIComponent(order.reference)}`}
                    className="flex min-h-14 items-center justify-between rounded-xl border border-border px-4 text-sm font-semibold hover:bg-surface-subtle"
                  >
                    <span>Order {order.reference}</span>
                    <span className="flex items-center gap-2 text-foreground-muted">
                      <span className="text-xs capitalize">
                        {order.paymentStatus.toLowerCase()}
                      </span>
                      <ArrowRight aria-hidden="true" className="size-4" />
                    </span>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="mt-5 rounded-xl border border-dashed border-border p-4 text-sm leading-6 text-foreground-muted">
                There are no resumable orders in this browser yet. Start with
                the store, or open your orders from the same device used to
                place them.
              </div>
            )}
          </Card>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Link href="/" className={cn(buttonVariants(), "gap-2")}>
              <ShoppingBag aria-hidden="true" className="size-4" />
              Shop the store
            </Link>
            <Link
              href="/orders"
              className={cn(buttonVariants({ variant: "secondary" }), "gap-2")}
            >
              <MapPin aria-hidden="true" className="size-4" />
              View my orders
            </Link>
          </div>
        </div>
      </PaymentConfirmationShell>
    </CheckoutPageShell>
  );
}
