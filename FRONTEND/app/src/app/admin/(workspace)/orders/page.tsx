import Link from "next/link";
import { Eye, ReceiptText, SearchX } from "lucide-react";
import { Money } from "@/components/commerce/money";
import { PageHeader } from "@/components/admin/page-header";
import {
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
  SearchField,
  Select,
  buttonVariants,
} from "@/components/ui";
import {
  adminOrdersHref,
  parseAdminOrderFilters,
} from "@/features/orders/params";
import { listAdminOrders } from "@/features/orders/server/queries";
import {
  OrderStatusBadge,
  PaymentStatusBadge,
} from "@/features/orders/components/status-badges";
import { cn } from "@/lib/utils";

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const filters = parseAdminOrderFilters(await searchParams);
  const result = await listAdminOrders(filters);
  const hasFilters = Boolean(
    filters.search ||
    filters.status !== "all" ||
    filters.paymentStatus !== "all" ||
    filters.paymentMethod !== "all" ||
    filters.fulfillment !== "all" ||
    filters.currency !== "all" ||
    filters.dateFrom ||
    filters.dateTo,
  );
  const date = new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
  });

  return (
    <div className="mx-auto max-w-7xl">
      <PageHeader
        eyebrow={
          <span className="text-sm font-semibold text-foreground-muted">
            Operations
          </span>
        }
        title="Orders"
        description="Find, verify, and process every real customer order."
      />

      <form
        action="/admin/orders"
        className="mt-7 grid gap-3 rounded-lg border border-border bg-surface p-4 shadow-xs"
      >
        <div className="grid gap-3 lg:grid-cols-[minmax(15rem,1fr)_repeat(3,minmax(9rem,0.45fr))]">
          <SearchField
            name="q"
            defaultValue={filters.search}
            label="Search orders"
            placeholder="Reference, customer, or phone"
          />
          <Select
            name="status"
            defaultValue={filters.status}
            aria-label="Order status"
          >
            <option value="all">All order statuses</option>
            <option value="PENDING">Pending</option>
            <option value="CONFIRMED">Confirmed</option>
            <option value="PROCESSING">Processing</option>
            <option value="READY">Ready</option>
            <option value="OUT_FOR_DELIVERY">Out for delivery</option>
            <option value="COMPLETED">Completed</option>
            <option value="CANCELLED">Cancelled</option>
          </Select>
          <Select
            name="paymentStatus"
            defaultValue={filters.paymentStatus}
            aria-label="Payment status"
          >
            <option value="all">All payment statuses</option>
            <option value="PENDING">Verification pending</option>
            <option value="PAID">Paid</option>
            <option value="UNPAID">Unpaid</option>
            <option value="REFUNDED">Refunded</option>
          </Select>
          <Select name="sort" defaultValue={filters.sort} aria-label="Sort">
            <option value="created-desc">Newest first</option>
            <option value="created-asc">Oldest first</option>
            <option value="total-desc">Highest total</option>
            <option value="total-asc">Lowest total</option>
            <option value="reference-asc">Reference A–Z</option>
          </Select>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-[repeat(5,minmax(8rem,1fr))_auto_auto]">
          <Select
            name="paymentMethod"
            defaultValue={filters.paymentMethod}
            aria-label="Payment method"
          >
            <option value="all">All payment methods</option>
            <option value="RECHARGE_FROM_STORE">From store</option>
            <option value="RECHARGE_ONLINE">Online</option>
            <option value="BITCOIN_DEPOSIT">Bitcoin deposit</option>
          </Select>
          <Select
            name="fulfillment"
            defaultValue={filters.fulfillment}
            aria-label="Fulfillment"
          >
            <option value="all">Pickup and delivery</option>
            <option value="PICKUP">Pickup</option>
            <option value="DELIVERY">Delivery</option>
          </Select>
          <Select
            name="currency"
            defaultValue={filters.currency}
            aria-label="Currency"
          >
            <option value="all">All currencies</option>
            <option value="GBP">GBP</option>
            <option value="EUR">EUR</option>
            <option value="USD">USD</option>
          </Select>
          <input
            type="date"
            name="dateFrom"
            defaultValue={filters.dateFrom}
            aria-label="Orders from date"
            className="h-12 rounded-md border border-border-strong bg-surface px-3.5"
          />
          <input
            type="date"
            name="dateTo"
            defaultValue={filters.dateTo}
            aria-label="Orders to date"
            className="h-12 rounded-md border border-border-strong bg-surface px-3.5"
          />
          <button className={cn(buttonVariants(), "w-full")}>Apply</button>
          {hasFilters && (
            <Link
              href="/admin/orders"
              className={cn(buttonVariants({ variant: "secondary" }), "w-full")}
            >
              Reset
            </Link>
          )}
        </div>
      </form>

      <div className="mt-6 flex items-center justify-between gap-4">
        <p className="text-sm text-foreground-muted" aria-live="polite">
          {result.totalCount === 1 ? "1 order" : `${result.totalCount} orders`}
        </p>
        <p className="text-xs text-foreground-subtle">
          Page {result.page} of {result.totalPages}
        </p>
      </div>

      <div className="mt-4">
        {result.orders.length ? (
          <>
            <ResponsiveDataView
              table={
                <DataTable>
                  <DataTableCaption>Customer orders</DataTableCaption>
                  <DataTableHeader>
                    <DataTableRow>
                      <DataTableHead>Order</DataTableHead>
                      <DataTableHead>Customer</DataTableHead>
                      <DataTableHead>Total</DataTableHead>
                      <DataTableHead>Order status</DataTableHead>
                      <DataTableHead>Payment</DataTableHead>
                      <DataTableHead className="text-right">
                        Action
                      </DataTableHead>
                    </DataTableRow>
                  </DataTableHeader>
                  <DataTableBody>
                    {result.orders.map((order) => (
                      <DataTableRow key={order.id}>
                        <DataTableCell>
                          <Link
                            href={`/admin/orders/${order.id}`}
                            className="font-mono text-sm font-semibold hover:underline"
                          >
                            {order.reference}
                          </Link>
                          <p className="mt-1 text-xs text-foreground-subtle">
                            {date.format(new Date(order.createdAt))}
                          </p>
                        </DataTableCell>
                        <DataTableCell>
                          <p className="font-medium">{order.customerName}</p>
                          <p className="mt-1 max-w-48 truncate text-xs text-foreground-muted">
                            {order.customerEmail ?? order.customerPhone ?? "—"}
                          </p>
                        </DataTableCell>
                        <DataTableCell>
                          <Money
                            amountMinor={order.totalMinor}
                            currency={order.currency}
                            className="font-mono font-semibold"
                          />
                          <p className="mt-1 text-xs text-foreground-subtle">
                            {order.itemCount}{" "}
                            {order.itemCount === 1 ? "item" : "items"}
                          </p>
                        </DataTableCell>
                        <DataTableCell>
                          <OrderStatusBadge status={order.status} />
                        </DataTableCell>
                        <DataTableCell>
                          <PaymentStatusBadge status={order.paymentStatus} />
                        </DataTableCell>
                        <DataTableCell className="text-right">
                          <Link
                            href={`/admin/orders/${order.id}`}
                            className={cn(
                              buttonVariants({
                                variant: "ghost",
                                size: "small",
                              }),
                            )}
                          >
                            View <Eye aria-hidden="true" className="size-4" />
                          </Link>
                        </DataTableCell>
                      </DataTableRow>
                    ))}
                  </DataTableBody>
                </DataTable>
              }
              mobile={
                <DataList>
                  {result.orders.map((order) => (
                    <DataListItem key={order.id}>
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="font-mono text-sm font-semibold">
                            {order.reference}
                          </p>
                          <p className="mt-1 truncate text-sm">
                            {order.customerName}
                          </p>
                        </div>
                        <Money
                          amountMinor={order.totalMinor}
                          currency={order.currency}
                          className="shrink-0 font-mono font-semibold"
                        />
                      </div>
                      <div className="mt-4 flex flex-wrap gap-2">
                        <OrderStatusBadge status={order.status} />
                        <PaymentStatusBadge status={order.paymentStatus} />
                      </div>
                      <div className="mt-4 flex items-center justify-between border-t border-border pt-3">
                        <p className="text-xs text-foreground-muted">
                          {date.format(new Date(order.createdAt))}
                        </p>
                        <Link
                          href={`/admin/orders/${order.id}`}
                          className={cn(
                            buttonVariants({
                              variant: "secondary",
                              size: "small",
                            }),
                          )}
                        >
                          View order
                        </Link>
                      </div>
                    </DataListItem>
                  ))}
                </DataList>
              }
            />
            <Pagination
              currentPage={result.page}
              totalPages={result.totalPages}
              className="mt-7"
              label="Order pages"
              getHref={(page) => adminOrdersHref(filters, { page })}
            />
          </>
        ) : (
          <EmptyState
            title={
              hasFilters ? "No orders match these filters" : "No orders yet"
            }
            description={
              hasFilters
                ? "Change or reset the filters to see other orders."
                : "Real customer orders will appear here after checkout."
            }
            icon={
              hasFilters ? (
                <SearchX aria-hidden="true" className="size-5" />
              ) : (
                <ReceiptText aria-hidden="true" className="size-5" />
              )
            }
            action={
              hasFilters ? (
                <Link href="/admin/orders" className={cn(buttonVariants())}>
                  Reset filters
                </Link>
              ) : undefined
            }
          />
        )}
      </div>
    </div>
  );
}
