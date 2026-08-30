import { beforeEach, describe, expect, it, vi } from "vitest";

const permission = vi.hoisted(() => vi.fn());
const updateMany = vi.hoisted(() => vi.fn());
const findMany = vi.hoisted(() => vi.fn());
const policyCount = vi.hoisted(() => vi.fn());

vi.mock("server-only", () => ({}));
vi.mock("@/server/auth/authorization", () => ({
  requireAdminPermission: permission,
}));
vi.mock("@/server/db/client", () => ({
  prisma: {
    specialOffer: { updateMany, findMany },
    categoryOfferPolicy: { count: policyCount },
  },
}));

const { listAdminOfferCampaigns, parseAdminOfferFilters } =
  await import("@/features/special-offers/server/admin-queries");

describe("admin special-offer queries", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    permission.mockResolvedValue({ id: "admin-id" });
    updateMany.mockResolvedValue({ count: 0 });
    policyCount.mockResolvedValue(2);
  });

  it("normalizes filters and rejects unknown statuses", () => {
    expect(
      parseAdminOfferFilters({ q: "  flower  ", status: "UNSAFE", page: "-4" }),
    ).toEqual({ query: "flower", status: "ALL", page: 1 });
    expect(parseAdminOfferFilters({ status: "ACTIVE", page: "3" })).toEqual({
      query: "",
      status: "ACTIVE",
      page: 3,
    });
  });

  it("authorizes, groups real offers by campaign and reports metrics", async () => {
    const endsAt = new Date(Date.now() + 30 * 60 * 1000);
    findMany
      .mockResolvedValueOnce([{ generationKey: "campaign-1" }])
      .mockResolvedValueOnce([
        { generationKey: "campaign-1", status: "ACTIVE", endsAt },
      ])
      .mockResolvedValueOnce([
        {
          generationKey: "campaign-1",
          status: "ACTIVE",
          startsAt: new Date("2026-08-26T10:00:00Z"),
          endsAt,
          discountBps: 1200,
          currency: "EUR",
          category: { id: "category-1", name: "Flowers" },
          product: { name: "Amnesia" },
        },
        {
          generationKey: "campaign-1",
          status: "ACTIVE",
          startsAt: new Date("2026-08-26T10:00:00Z"),
          endsAt,
          discountBps: 800,
          currency: "EUR",
          category: { id: "category-1", name: "Flowers" },
          product: { name: "Haze" },
        },
      ]);

    const result = await listAdminOfferCampaigns({
      query: "",
      status: "ALL",
      page: 1,
    });

    expect(permission).toHaveBeenCalledWith("catalog.read");
    expect(result.metrics).toMatchObject({
      total: 1,
      active: 1,
      drafts: 0,
      enabledCategories: 2,
    });
    expect(result.campaigns[0]).toMatchObject({
      generationKey: "campaign-1",
      category: { name: "Flowers" },
      offerCount: 2,
      maximumDiscountBps: 1200,
      currencies: ["EUR"],
      products: ["Amnesia", "Haze"],
    });
  });
});
