import { describe, expect, it } from "vitest";
import {
  adminDeliveriesHref,
  parseAdminDeliveryFilters,
} from "@/features/delivery-operations/params";

describe("admin delivery parameters", () => {
  it("normalizes and whitelists delivery filters", () => {
    expect(
      parseAdminDeliveryFilters({
        q: "  MG   customer ",
        courier: "  Maxime97  ",
        status: "OUT_FOR_DELIVERY",
        tracking: "ACTIVE",
        sort: "eta-asc",
        page: "3",
      }),
    ).toEqual({
      search: "MG customer",
      courier: "Maxime97",
      status: "OUT_FOR_DELIVERY",
      tracking: "ACTIVE",
      sort: "eta-asc",
      page: 3,
    });
  });

  it("rejects arbitrary filters and creates canonical URLs", () => {
    const filters = parseAdminDeliveryFilters({
      status: "DELETE",
      tracking: "GPS_SECRET",
      sort: "random",
      page: "-1",
    });
    expect(filters).toMatchObject({
      status: "all",
      tracking: "all",
      sort: "created-desc",
      page: 1,
    });
    expect(
      adminDeliveriesHref(filters, {
        courier: "Sofia508",
        tracking: "NOT_STARTED",
        page: 2,
      }),
    ).toBe("/admin/deliveries?tracking=NOT_STARTED&courier=Sofia508&page=2");
  });
});
