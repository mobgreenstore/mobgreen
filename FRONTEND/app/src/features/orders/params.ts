import {
  ORDER_SORTS,
  ORDER_STATUSES,
  PAYMENT_STATUSES,
  type AdminOrderSort,
  type AdminOrderStatus,
  type AdminPaymentStatus,
} from "@/features/orders/types";
import type { SupportedCurrency } from "@/config/commerce";
import {
  isPaymentMethod,
  type PaymentMethodId,
} from "@/features/payments/payment-method";

export interface AdminOrderFilters {
  search: string;
  status: AdminOrderStatus | "all";
  paymentStatus: AdminPaymentStatus | "all";
  paymentMethod: PaymentMethodId | "all";
  fulfillment: "PICKUP" | "DELIVERY" | "all";
  currency: SupportedCurrency | "all";
  dateFrom: string;
  dateTo: string;
  sort: AdminOrderSort;
  page: number;
}

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export function parseAdminOrderFilters(
  params: Record<string, string | string[] | undefined>,
): AdminOrderFilters {
  const status = first(params.status);
  const paymentStatus = first(params.paymentStatus);
  const paymentMethod = first(params.paymentMethod);
  const fulfillment = first(params.fulfillment);
  const currency = first(params.currency);
  const sort = first(params.sort);
  const page = Number.parseInt(first(params.page) ?? "1", 10);
  return {
    search: (first(params.q) ?? "")
      .normalize("NFKC")
      .trim()
      .replace(/\s+/g, " ")
      .slice(0, 120),
    status: ORDER_STATUSES.includes(status as AdminOrderStatus)
      ? (status as AdminOrderStatus)
      : "all",
    paymentStatus: PAYMENT_STATUSES.includes(
      paymentStatus as AdminPaymentStatus,
    )
      ? (paymentStatus as AdminPaymentStatus)
      : "all",
    paymentMethod:
      paymentMethod && isPaymentMethod(paymentMethod) ? paymentMethod : "all",
    fulfillment:
      fulfillment === "PICKUP" || fulfillment === "DELIVERY"
        ? fulfillment
        : "all",
    currency:
      currency === "GBP" || currency === "EUR" || currency === "USD"
        ? currency
        : "all",
    dateFrom: /^\d{4}-\d{2}-\d{2}$/.test(first(params.dateFrom) ?? "")
      ? first(params.dateFrom)!
      : "",
    dateTo: /^\d{4}-\d{2}-\d{2}$/.test(first(params.dateTo) ?? "")
      ? first(params.dateTo)!
      : "",
    sort: ORDER_SORTS.includes(sort as AdminOrderSort)
      ? (sort as AdminOrderSort)
      : "created-desc",
    page: Number.isSafeInteger(page) && page > 0 ? page : 1,
  };
}

export function adminOrdersHref(
  filters: AdminOrderFilters,
  overrides: Partial<AdminOrderFilters> = {},
) {
  const value = { ...filters, ...overrides };
  const params = new URLSearchParams();
  if (value.search) params.set("q", value.search);
  if (value.status !== "all") params.set("status", value.status);
  if (value.paymentStatus !== "all")
    params.set("paymentStatus", value.paymentStatus);
  if (value.paymentMethod !== "all")
    params.set("paymentMethod", value.paymentMethod);
  if (value.fulfillment !== "all") params.set("fulfillment", value.fulfillment);
  if (value.currency !== "all") params.set("currency", value.currency);
  if (value.dateFrom) params.set("dateFrom", value.dateFrom);
  if (value.dateTo) params.set("dateTo", value.dateTo);
  if (value.sort !== "created-desc") params.set("sort", value.sort);
  if (value.page > 1) params.set("page", String(value.page));
  const query = params.toString();
  return query ? `/admin/orders?${query}` : "/admin/orders";
}
