import Link from "next/link";
import {
  BadgePercent,
  Bike,
  Boxes,
  FolderTree,
  PackagePlus,
  ShoppingCart,
  ShieldCheck,
} from "lucide-react";
import { MetricCard, PageHeader } from "@/components/admin";
import { Money } from "@/components/commerce";
import { Badge, EmptyState } from "@/components/ui";
import { buttonVariants } from "@/components/ui/button";
import { getAdminOverview } from "@/features/admin-overview/server/query";
import { cn } from "@/lib/utils";

function orderTone(status: string) {
  if (status === "COMPLETED") return "success" as const;
  if (status === "CANCELLED") return "danger" as const;
  if (status === "CONFIRMED" || status === "PROCESSING" || status === "READY")
    return "info" as const;
  return "neutral" as const;
}

export async function AdminOverviewPage() {
  const overview = await getAdminOverview();

  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader
        eyebrow={<Badge tone="info">Live operations</Badge>}
        title="Store overview"
        description="A current view of MOB GREENS catalog, campaigns, orders and deliveries."
        actions={
          <Link
            href="/admin/products/new"
            className={cn(buttonVariants({ variant: "primary" }))}
          >
            <PackagePlus aria-hidden="true" className="size-4" />
            Add products
          </Link>
        }
      />

      <section
        aria-label="Overview metrics"
        className="mt-8 grid gap-3 sm:grid-cols-2 xl:grid-cols-6"
      >
        <MetricCard
          label="Pending verification"
          value={overview.metrics.pendingVerification}
          note="Recharge codes awaiting review"
          icon={<ShieldCheck aria-hidden="true" className="size-5" />}
        />
        <MetricCard
          label="Orders today"
          value={overview.metrics.ordersToday}
          note="Created since local midnight"
          icon={<ShoppingCart aria-hidden="true" className="size-5" />}
        />
        <MetricCard
          label="Active products"
          value={overview.metrics.activeProducts}
          note="Visible catalog products"
          icon={<Boxes aria-hidden="true" className="size-5" />}
        />
        <MetricCard
          label="Active categories"
          value={overview.metrics.activeCategories}
          note="Available storefront categories"
          icon={<FolderTree aria-hidden="true" className="size-5" />}
        />
        <MetricCard
          label="Live offers"
          value={overview.metrics.activeOffers}
          note="Customer-visible offer tiers"
          icon={<BadgePercent aria-hidden="true" className="size-5" />}
        />
        <MetricCard
          label="Open deliveries"
          value={overview.metrics.openDeliveries}
          note="Confirmed through out for delivery"
          icon={<Bike aria-hidden="true" className="size-5" />}
        />
      </section>

      <section
        className="mt-8 overflow-hidden rounded-lg border border-border bg-surface shadow-xs"
        aria-labelledby="orders-heading"
      >
        <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 sm:px-6">
          <div>
            <h2
              id="orders-heading"
              className="font-semibold tracking-[-0.02em]"
            >
              Recent orders
            </h2>
            <p className="mt-1 text-sm text-foreground-muted">
              The five newest real customer orders.
            </p>
          </div>
          <Link
            href="/admin/orders"
            className={cn(buttonVariants({ variant: "ghost", size: "small" }))}
          >
            View all orders
          </Link>
        </div>

        {overview.recentOrders.length ? (
          <div className="divide-y divide-border">
            {overview.recentOrders.map((order) => (
              <article
                key={order.id}
                className="grid gap-3 px-5 py-4 sm:px-6 md:grid-cols-[1fr_1fr_auto_auto] md:items-center"
              >
                <div>
                  <Link
                    href={`/admin/orders/${order.id}`}
                    className="font-semibold hover:underline"
                  >
                    {order.reference}
                  </Link>
                  <p className="mt-1 text-xs text-foreground-subtle">
                    {new Date(order.createdAt).toLocaleString()}
                  </p>
                </div>
                <p className="truncate text-sm text-foreground-muted">
                  {order.customerName}
                </p>
                <Money
                  amountMinor={order.totalMinor}
                  currency={order.currency}
                />
                <Badge tone={orderTone(order.status)}>
                  {order.status.replaceAll("_", " ").toLowerCase()}
                </Badge>
              </article>
            ))}
          </div>
        ) : (
          <EmptyState
            compact
            className="m-5 sm:m-6"
            icon={<ShoppingCart aria-hidden="true" className="size-5" />}
            title="No orders yet"
            description="Real orders will appear here as soon as a customer completes checkout."
          />
        )}
      </section>
    </div>
  );
}
