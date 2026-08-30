import Link from "next/link";
import {
  Bike,
  Clock3,
  MapPinned,
  Route,
  Search,
  UserRoundX,
} from "lucide-react";
import { MetricCard, PageHeader } from "@/components/admin";
import {
  Badge,
  Button,
  DataList,
  DataListItem,
  DataTable,
  DataTableBody,
  DataTableCaption,
  DataTableCell,
  DataTableHead,
  DataTableHeader,
  DataTableRow,
  EmptyState,
  Pagination,
  ResponsiveDataView,
  Select,
  TextField,
  buttonVariants,
} from "@/components/ui";
import {
  OrderStatusBadge,
  PaymentStatusBadge,
} from "@/features/orders/components/status-badges";
import {
  adminDeliveriesHref,
  parseAdminDeliveryFilters,
} from "@/features/delivery-operations/params";
import { listAdminDeliveries } from "@/features/delivery-operations/server/queries";
import type { AdminDeliveryListItem } from "@/features/delivery-operations/types";
import { cn } from "@/lib/utils";

export const metadata = { title: "Delivery operations" };

function distance(value: number | null) {
  if (value === null) return "—";
  return value < 1_000 ? `${value} m` : `${(value / 1_000).toFixed(1)} km`;
}

function duration(value: number | null) {
  return value === null ? "—" : `${Math.max(1, Math.ceil(value / 60))} min`;
}

function TrackingBadge({ delivery }: { delivery: AdminDeliveryListItem }) {
  if (!delivery.trackingState) return <Badge tone="neutral">Not started</Badge>;
  return (
    <Badge tone={delivery.trackingState === "ACTIVE" ? "info" : "neutral"}>
      {delivery.trackingState.toLowerCase().replaceAll("_", " ")}
    </Badge>
  );
}

function DeliveryMobileCard({ delivery }: { delivery: AdminDeliveryListItem }) {
  return (
    <DataListItem>
      <div className="flex items-start justify-between gap-3">
        <div>
          <Link
            href={`/admin/orders/${delivery.id}`}
            className="font-mono text-sm font-semibold hover:underline"
          >
            {delivery.reference}
          </Link>
          <p className="mt-1 text-sm font-medium">{delivery.customerName}</p>
          <p className="mt-1 text-xs text-foreground-muted">
            {delivery.locality ?? "Location unavailable"}
          </p>
        </div>
        <OrderStatusBadge status={delivery.status} />
      </div>
      <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
        <div className="rounded-lg bg-surface-subtle p-3">
          <p className="text-xs text-foreground-muted">Courier</p>
          <p className="mt-1 truncate font-semibold">
            {delivery.courierName ?? "Unassigned"}
          </p>
          <p className="mt-1 text-xs text-foreground-muted">
            {distance(delivery.courierDistanceMeters)} ·{" "}
            {duration(delivery.courierDurationSeconds)}
          </p>
        </div>
        <div className="rounded-lg bg-surface-subtle p-3">
          <p className="text-xs text-foreground-muted">Tracking</p>
          <div className="mt-2">
            <TrackingBadge delivery={delivery} />
          </div>
        </div>
      </div>
      <div className="mt-4 flex items-center justify-between gap-3">
        <PaymentStatusBadge status={delivery.paymentStatus} />
        <Link
          href={`/admin/orders/${delivery.id}`}
          className={cn(
            buttonVariants({ variant: "secondary", size: "small" }),
          )}
        >
          View delivery
        </Link>
      </div>
    </DataListItem>
  );
}

export default async function AdminDeliveriesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const filters = parseAdminDeliveryFilters(await searchParams);
  const result = await listAdminDeliveries(filters);
  const hasFilters = Boolean(
    filters.search ||
    filters.status !== "all" ||
    filters.tracking !== "all" ||
    filters.courier ||
    filters.sort !== "created-desc",
  );

  return (
    <div className="mx-auto max-w-7xl">
      <PageHeader
        eyebrow={<Badge tone="info">Operations</Badge>}
        title="Deliveries"
        description="Find delivery orders, inspect simulated courier assignments, and monitor the real Mapbox tracking lifecycle."
      />

      <section
        aria-label="Delivery metrics"
        className="mt-8 grid gap-3 sm:grid-cols-2 xl:grid-cols-4"
      >
        <MetricCard
          label="Open deliveries"
          value={result.metrics.open}
          icon={<Bike className="size-5" />}
        />
        <MetricCard
          label="Out for delivery"
          value={result.metrics.outForDelivery}
          icon={<Route className="size-5" />}
        />
        <MetricCard
          label="Active tracking"
          value={result.metrics.activeTracking}
          icon={<MapPinned className="size-5" />}
        />
        <MetricCard
          label="Without courier"
          value={result.metrics.withoutCourier}
          icon={<UserRoundX className="size-5" />}
        />
      </section>

      <form
        method="get"
        className="mt-6 grid gap-3 rounded-lg border border-border bg-surface p-4 shadow-xs md:grid-cols-2 xl:grid-cols-[minmax(15rem,1fr)_repeat(4,minmax(9rem,auto))]"
      >
        <div className="relative">
          <Search
            aria-hidden="true"
            className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-foreground-subtle"
          />
          <TextField
            name="q"
            defaultValue={filters.search}
            placeholder="Reference, customer, or locality"
            aria-label="Search deliveries"
            className="pl-9"
          />
        </div>
        <TextField
          name="courier"
          defaultValue={filters.courier}
          placeholder="Courier handle"
          aria-label="Filter by courier"
        />
        <Select
          name="status"
          defaultValue={filters.status}
          aria-label="Filter delivery status"
        >
          <option value="all">All statuses</option>
          <option value="PENDING">Pending</option>
          <option value="CONFIRMED">Confirmed</option>
          <option value="PROCESSING">Processing</option>
          <option value="READY">Ready</option>
          <option value="OUT_FOR_DELIVERY">Out for delivery</option>
          <option value="COMPLETED">Completed</option>
          <option value="CANCELLED">Cancelled</option>
        </Select>
        <Select
          name="tracking"
          defaultValue={filters.tracking}
          aria-label="Filter tracking state"
        >
          <option value="all">All tracking</option>
          <option value="NOT_STARTED">Not started</option>
          <option value="ACTIVE">Active</option>
          <option value="PAUSED">Paused</option>
          <option value="COMPLETED">Completed</option>
          <option value="CANCELLED">Cancelled</option>
        </Select>
        <div className="flex gap-2">
          <Select
            name="sort"
            defaultValue={filters.sort}
            aria-label="Sort deliveries"
          >
            <option value="created-desc">Newest</option>
            <option value="created-asc">Oldest</option>
            <option value="distance-asc">Nearest courier</option>
            <option value="eta-asc">Earliest arrival</option>
          </Select>
          <Button type="submit">Apply</Button>
        </div>
      </form>

      <div className="mt-6">
        {result.deliveries.length ? (
          <>
            <ResponsiveDataView
              mobile={
                <DataList>
                  {result.deliveries.map((delivery) => (
                    <DeliveryMobileCard key={delivery.id} delivery={delivery} />
                  ))}
                </DataList>
              }
              table={
                <DataTable>
                  <DataTableCaption>
                    Database-backed delivery orders
                  </DataTableCaption>
                  <DataTableHeader>
                    <DataTableRow>
                      <DataTableHead>Order</DataTableHead>
                      <DataTableHead>Customer</DataTableHead>
                      <DataTableHead>Courier</DataTableHead>
                      <DataTableHead>Tracking</DataTableHead>
                      <DataTableHead>Status</DataTableHead>
                      <DataTableHead>
                        <span className="sr-only">Action</span>
                      </DataTableHead>
                    </DataTableRow>
                  </DataTableHeader>
                  <DataTableBody>
                    {result.deliveries.map((delivery) => (
                      <DataTableRow key={delivery.id}>
                        <DataTableCell>
                          <Link
                            href={`/admin/orders/${delivery.id}`}
                            className="font-mono font-semibold hover:underline"
                          >
                            {delivery.reference}
                          </Link>
                        </DataTableCell>
                        <DataTableCell>
                          <p className="font-medium">{delivery.customerName}</p>
                          <p className="text-xs text-foreground-muted">
                            {delivery.locality ?? "—"}
                          </p>
                        </DataTableCell>
                        <DataTableCell>
                          <p className="font-medium">
                            {delivery.courierName ?? "Unassigned"}
                          </p>
                          <p className="text-xs text-foreground-muted">
                            {distance(delivery.courierDistanceMeters)} ·{" "}
                            {duration(delivery.courierDurationSeconds)}
                          </p>
                        </DataTableCell>
                        <DataTableCell>
                          <TrackingBadge delivery={delivery} />
                        </DataTableCell>
                        <DataTableCell>
                          <div className="grid gap-1">
                            <OrderStatusBadge status={delivery.status} />
                            <PaymentStatusBadge
                              status={delivery.paymentStatus}
                            />
                          </div>
                        </DataTableCell>
                        <DataTableCell>
                          <Link
                            href={`/admin/orders/${delivery.id}`}
                            className={cn(
                              buttonVariants({
                                variant: "secondary",
                                size: "small",
                              }),
                            )}
                          >
                            View
                          </Link>
                        </DataTableCell>
                      </DataTableRow>
                    ))}
                  </DataTableBody>
                </DataTable>
              }
            />
            <Pagination
              currentPage={result.page}
              totalPages={result.totalPages}
              className="mt-7"
              label="Delivery pages"
              getHref={(page) => adminDeliveriesHref(filters, { page })}
            />
          </>
        ) : (
          <EmptyState
            title={
              hasFilters
                ? "No deliveries match these filters"
                : "No delivery orders yet"
            }
            description={
              hasFilters
                ? "Adjust or clear the filters to see other delivery orders."
                : "Delivery orders will appear here after customers complete checkout."
            }
            icon={<Clock3 aria-hidden="true" className="size-5" />}
            action={
              hasFilters ? (
                <Link
                  href="/admin/deliveries"
                  className={cn(buttonVariants({ variant: "secondary" }))}
                >
                  Clear filters
                </Link>
              ) : undefined
            }
          />
        )}
      </div>
    </div>
  );
}
