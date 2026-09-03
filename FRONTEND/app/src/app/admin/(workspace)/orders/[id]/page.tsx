import Link from "next/link";
import {
  ArrowLeft,
  BadgePercent,
  Mail,
  MapPinned,
  PackageCheck,
  Route,
} from "lucide-react";
import { notFound } from "next/navigation";
import { Money } from "@/components/commerce/money";
import { WeightDisplay } from "@/components/commerce/weight-display";
import { PageHeader } from "@/components/admin/page-header";
import { Badge, Card, InlineAlert } from "@/components/ui";
import { OrderOperationsPanel } from "@/features/orders/components/order-operations-panel";
import { AdminPaymentAttemptCard } from "@/features/orders/components/admin-payment-attempt-card";
import { CourierAssignmentCard } from "@/features/delivery-matching/components/courier-assignment-card";
import { AdminCourierAssignment } from "@/features/delivery-operations/components/admin-courier-assignment";
import { OrderOperationsTimeline } from "@/features/orders/components/order-operations-timeline";
import { DynamicTrackingMap } from "@/features/location/components/dynamic-tracking-map";
import { VerificationReviewPanel } from "@/features/orders/components/verification-review-panel";
import {
  OrderStatusBadge,
  PaymentStatusBadge,
} from "@/features/orders/components/status-badges";
import { getAdminOrder } from "@/features/orders/server/queries";
import { paymentMethodLabel } from "@/features/payments/payment-method";
import {
  validOrderTransitions,
  validPaymentTransitions,
} from "@/features/orders/server/order-operation-service";
import {
  hasAdminPermission,
  requireAdminPermission,
} from "@/server/auth/authorization";

export default async function AdminOrderDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const admin = await requireAdminPermission("orders.read");
  const order = await getAdminOrder((await params).id);
  if (!order) notFound();
  const canWrite = hasAdminPermission(admin.role, "orders.write");
  const canVerify = hasAdminPermission(admin.role, "payments.verify");
  const created = new Intl.DateTimeFormat("en", {
    dateStyle: "long",
    timeStyle: "short",
  }).format(new Date(order.createdAt));

  return (
    <div className="mx-auto max-w-7xl">
      <Link
        href="/admin/orders"
        className="mb-5 inline-flex min-h-11 items-center gap-1.5 text-sm font-semibold text-foreground-muted hover:text-foreground"
      >
        <ArrowLeft aria-hidden="true" className="size-4" />
        Back to orders
      </Link>
      <PageHeader
        eyebrow={
          <div className="flex flex-wrap gap-2">
            <OrderStatusBadge status={order.status} />
            <PaymentStatusBadge status={order.paymentStatus} />
          </div>
        }
        title={order.reference}
        description={`Placed ${created} · ${order.itemCount} ${order.itemCount === 1 ? "item" : "items"}`}
      />

      <div className="mt-8 grid gap-6 xl:grid-cols-[minmax(0,1fr)_23rem] xl:items-start">
        <div className="grid gap-6">
          <Card className="p-5 sm:p-6">
            <h2 className="text-lg font-semibold">Customer and fulfillment</h2>
            <dl className="mt-5 grid gap-5 sm:grid-cols-2">
              <div>
                <dt className="text-xs font-semibold tracking-[0.08em] text-foreground-subtle uppercase">
                  Customer
                </dt>
                <dd className="mt-1 font-medium">{order.customerName}</dd>
              </div>
              <div>
                <dt className="text-xs font-semibold tracking-[0.08em] text-foreground-subtle uppercase">
                  Email
                </dt>
                <dd className="mt-1">
                  {order.customerEmail ? (
                    <a
                      href={`mailto:${order.customerEmail}`}
                      className="inline-flex items-center gap-2 text-sm font-medium hover:underline"
                    >
                      <Mail aria-hidden="true" className="size-4" />
                      {order.customerEmail}
                    </a>
                  ) : (
                    "—"
                  )}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-semibold tracking-[0.08em] text-foreground-subtle uppercase">
                  Fulfillment
                </dt>
                <dd className="mt-1 font-medium">
                  {order.fulfillmentType === "PICKUP" ? "Pickup" : "Delivery"}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-semibold tracking-[0.08em] text-foreground-subtle uppercase">
                  Recharge method
                </dt>
                <dd className="mt-1 font-medium">
                  {paymentMethodLabel(
                    order.paymentMethod,
                    order.rechargeProvider,
                  )}
                </dd>
              </div>
            </dl>
            {order.customerNote && (
              <div className="mt-5 border-t border-border pt-5">
                <p className="text-xs font-semibold tracking-[0.08em] text-foreground-subtle uppercase">
                  Customer note
                </p>
                <p className="mt-2 text-sm leading-6 text-foreground-muted">
                  {order.customerNote}
                </p>
              </div>
            )}
          </Card>

          <AdminPaymentAttemptCard order={order} />

          {order.fulfillmentType === "DELIVERY" && (
            <Card className="p-5 sm:p-6">
              <div className="flex items-center gap-2">
                <MapPinned aria-hidden="true" className="size-5" />
                <h2 className="text-lg font-semibold">Delivery and tracking</h2>
              </div>
              {order.deliveryLocation ? (
                <div className="mt-4">
                  <p className="text-sm font-medium">
                    {order.deliveryLocation.formattedAddress}
                  </p>
                  <p className="mt-1 text-sm text-foreground-muted">
                    {[
                      order.deliveryLocation.locality,
                      order.deliveryLocation.postalCode,
                      order.deliveryLocation.countryCode,
                    ]
                      .filter(Boolean)
                      .join(" · ")}
                  </p>
                </div>
              ) : (
                <InlineAlert
                  className="mt-4"
                  tone="danger"
                  title="Customer destination missing"
                  description="A confirmed delivery destination is required before dispatch."
                />
              )}
              {!order.destinationCoordinatesPresent && (
                <InlineAlert
                  className="mt-4"
                  tone="danger"
                  title="Destination coordinates missing"
                  description="This delivery cannot move to out for delivery until its destination is validated."
                />
              )}
              {!order.dispatchConfigured && (
                <InlineAlert
                  className="mt-4"
                  tone="info"
                  title="Private dispatch origin missing"
                  description={
                    <>
                      Configure the routing origin in{" "}
                      <Link
                        className="font-semibold underline"
                        href="/admin/settings"
                      >
                        store settings
                      </Link>
                      .
                    </>
                  }
                />
              )}
              {order.courier && (
                <CourierAssignmentCard
                  courier={order.courier}
                  className="mt-4"
                />
              )}
              {canWrite && (
                <div className="mt-5 border-t border-border pt-5">
                  <h3 className="font-semibold">Courier candidates</h3>
                  <p className="mt-1 mb-4 text-sm text-foreground-muted">
                    Review the preserved checkout candidates or change the
                    simulated assignment before dispatch.
                  </p>
                  <AdminCourierAssignment
                    orderId={order.id}
                    candidates={order.courierCandidates}
                    currentCandidateId={order.courierCandidateId}
                    locked={order.courierAssignmentLocked}
                  />
                </div>
              )}
              {order.tracking && (
                <div className="mt-5 grid gap-4">
                  <DynamicTrackingMap tracking={order.tracking} compact />
                  <dl className="grid grid-cols-2 gap-3">
                    <div className="rounded-xl bg-surface-subtle p-4">
                      <dt className="flex items-center gap-2 text-xs text-foreground-muted">
                        <Route aria-hidden="true" className="size-4" /> Route
                      </dt>
                      <dd className="mt-2 font-semibold">
                        {(order.tracking.routeDistanceMeters / 1000).toFixed(1)}{" "}
                        km
                      </dd>
                    </div>
                    <div className="rounded-xl bg-surface-subtle p-4">
                      <dt className="text-xs text-foreground-muted">
                        Estimated arrival
                      </dt>
                      <dd className="mt-2 font-semibold">
                        {new Intl.DateTimeFormat("en", {
                          dateStyle: "medium",
                          timeStyle: "short",
                        }).format(new Date(order.tracking.estimatedArrivalAt))}
                      </dd>
                    </div>
                  </dl>
                  {order.tracking.routeKind === "DIRECT_FALLBACK" && (
                    <InlineAlert
                      tone="info"
                      title="Direct simulated fallback"
                      description="The provider did not return a supported road route. This trajectory is not a driving route."
                    />
                  )}
                </div>
              )}
            </Card>
          )}

          <Card className="overflow-hidden">
            <div className="border-b border-border px-5 py-4 sm:px-6">
              <h2 className="text-lg font-semibold">Order items</h2>
            </div>
            <div className="divide-y divide-border">
              {order.items.map((item) => (
                <article
                  key={item.id}
                  className="grid gap-3 px-5 py-4 sm:grid-cols-[minmax(0,1fr)_auto_auto] sm:items-center sm:px-6"
                >
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-medium">{item.productName}</h3>
                      {item.offer && (
                        <Badge tone="success">
                          <BadgePercent
                            aria-hidden="true"
                            className="mr-1 size-3.5"
                          />
                          {item.offer.discountBps / 100}% off
                        </Badge>
                      )}
                    </div>
                    <p className="mt-1 text-xs text-foreground-muted">
                      <WeightDisplay
                        value={item.weightValue}
                        unit={item.weightUnit}
                      />{" "}
                      · {item.quantity} ×{" "}
                      <Money
                        amountMinor={item.unitPriceMinor}
                        currency={item.currency}
                      />
                    </p>
                    {item.offer && (
                      <p className="mt-2 text-xs leading-5 text-foreground-muted">
                        Special offer: {item.offer.bundleQuantity} option
                        bundles · normal{" "}
                        <Money
                          amountMinor={item.offer.originalTotalMinor}
                          currency={item.currency}
                          className="line-through"
                        />{" "}
                        · saved{" "}
                        <Money
                          amountMinor={item.offer.discountMinor}
                          currency={item.currency}
                        />
                      </p>
                    )}
                  </div>
                  <p className="text-sm text-foreground-muted">
                    Qty {item.quantity}
                  </p>
                  <Money
                    amountMinor={item.lineTotalMinor}
                    currency={item.currency}
                    className="font-mono font-semibold"
                  />
                </article>
              ))}
            </div>
            <div className="flex items-center justify-between border-t border-border bg-surface-subtle px-5 py-5 sm:px-6">
              <span className="font-semibold">Order total</span>
              <Money
                amountMinor={order.totalMinor}
                currency={order.currency}
                className="font-mono text-xl font-semibold"
              />
            </div>
          </Card>

          <Card className="p-5 sm:p-6">
            <h2 className="text-lg font-semibold">Activity timeline</h2>
            <div className="mt-6">
              <OrderOperationsTimeline events={order.timeline} />
            </div>
          </Card>
        </div>

        <aside className="grid gap-6 xl:sticky xl:top-24">
          <Card className="p-5">
            <VerificationReviewPanel
              orderId={order.id}
              codeAvailable={order.verificationCodeAvailable}
              canVerify={canVerify}
              orderStatus={order.status}
              paymentStatus={order.paymentStatus}
              notification={order.notification}
            />
          </Card>

          {canWrite ? (
            <Card className="p-5">
              <div className="mb-5 flex items-center gap-2">
                <PackageCheck aria-hidden="true" className="size-5" />
                <h2 className="font-semibold">Process order</h2>
              </div>
              <OrderOperationsPanel
                orderId={order.id}
                orderTransitions={validOrderTransitions(
                  order.status,
                  order.fulfillmentType,
                )}
                paymentTransitions={validPaymentTransitions(
                  order.paymentStatus,
                )}
                trackingAvailable={
                  order.status === "OUT_FOR_DELIVERY" && Boolean(order.tracking)
                }
              />
            </Card>
          ) : (
            <InlineAlert
              title="Read-only access"
              description="Your role can inspect orders but cannot change them."
            />
          )}
        </aside>
      </div>
    </div>
  );
}
