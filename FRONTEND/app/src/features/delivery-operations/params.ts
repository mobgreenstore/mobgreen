import { ORDER_STATUSES, type AdminOrderStatus } from "@/features/orders/types";
import {
  DELIVERY_SORTS,
  DELIVERY_TRACKING_FILTERS,
  type AdminDeliveryFilters,
  type DeliverySort,
  type DeliveryTrackingFilter,
} from "@/features/delivery-operations/types";

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function normalized(value: string | undefined, maximum: number) {
  return (value ?? "")
    .normalize("NFKC")
    .trim()
    .replace(/\s+/g, " ")
    .slice(0, maximum);
}

export function parseAdminDeliveryFilters(
  params: Record<string, string | string[] | undefined>,
): AdminDeliveryFilters {
  const status = first(params.status);
  const tracking = first(params.tracking);
  const sort = first(params.sort);
  const page = Number.parseInt(first(params.page) ?? "1", 10);
  return {
    search: normalized(first(params.q), 120),
    status: ORDER_STATUSES.includes(status as AdminOrderStatus)
      ? (status as AdminOrderStatus)
      : "all",
    tracking: DELIVERY_TRACKING_FILTERS.includes(
      tracking as DeliveryTrackingFilter,
    )
      ? (tracking as DeliveryTrackingFilter)
      : "all",
    courier: normalized(first(params.courier), 80),
    sort: DELIVERY_SORTS.includes(sort as DeliverySort)
      ? (sort as DeliverySort)
      : "created-desc",
    page: Number.isSafeInteger(page) && page > 0 ? page : 1,
  };
}

export function adminDeliveriesHref(
  filters: AdminDeliveryFilters,
  overrides: Partial<AdminDeliveryFilters> = {},
) {
  const value = { ...filters, ...overrides };
  const params = new URLSearchParams();
  if (value.search) params.set("q", value.search);
  if (value.status !== "all") params.set("status", value.status);
  if (value.tracking !== "all") params.set("tracking", value.tracking);
  if (value.courier) params.set("courier", value.courier);
  if (value.sort !== "created-desc") params.set("sort", value.sort);
  if (value.page > 1) params.set("page", String(value.page));
  const query = params.toString();
  return query ? `/admin/deliveries?${query}` : "/admin/deliveries";
}
