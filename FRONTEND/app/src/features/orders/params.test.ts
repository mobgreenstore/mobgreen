import { describe, expect, it } from "vitest";
import {
  adminOrdersHref,
  parseAdminOrderFilters,
} from "@/features/orders/params";

describe("admin order filters", () => {
  it("normalizes search and accepts only whitelisted filters and sorting", () => {
    const filters = parseAdminOrderFilters({
      q: "  MG-2026   Customer  ",
      status: "PROCESSING",
      paymentStatus: "PAID",
      paymentMethod: "RECHARGE_ONLINE",
      fulfillment: "DELIVERY",
      currency: "EUR",
      dateFrom: "2026-08-01",
      dateTo: "2026-08-13",
      sort: "total-desc",
      page: "3",
    });
    expect(filters).toEqual({
      search: "MG-2026 Customer",
      status: "PROCESSING",
      paymentStatus: "PAID",
      paymentMethod: "RECHARGE_ONLINE",
      fulfillment: "DELIVERY",
      currency: "EUR",
      dateFrom: "2026-08-01",
      dateTo: "2026-08-13",
      sort: "total-desc",
      page: 3,
    });
  });

  it("falls back safely for unapproved values", () => {
    expect(
      parseAdminOrderFilters({
        status: "DROP",
        sort: "password-desc",
        currency: "CAD",
        page: "-4",
        dateFrom: "yesterday",
      }),
    ).toMatchObject({
      status: "all",
      sort: "created-desc",
      currency: "all",
      page: 1,
      dateFrom: "",
    });
  });

  it("keeps active filters in pagination links", () => {
    const filters = parseAdminOrderFilters({
      q: "Ngon",
      status: "PENDING",
      sort: "created-asc",
    });
    expect(adminOrdersHref(filters, { page: 2 })).toBe(
      "/admin/orders?q=Ngon&status=PENDING&sort=created-asc&page=2",
    );
  });
});
