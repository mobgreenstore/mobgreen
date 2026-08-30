import { beforeEach, describe, expect, it, vi } from "vitest";

const permission = vi.hoisted(() => vi.fn(async () => ({ id: "admin-id" })));
const count = vi.hoisted(() => vi.fn());
const findMany = vi.hoisted(() => vi.fn());
const findUnique = vi.hoisted(() => vi.fn());

vi.mock("@/server/auth/authorization", () => ({
  requireAdminPermission: permission,
}));
vi.mock("@/server/db/client", () => ({
  prisma: { order: { count, findMany, findUnique } },
}));
vi.mock("@/features/checkout/server/code-encryption", () => ({
  decryptVerificationCode: vi.fn(() => "1234567890"),
}));

const { listAdminOrders, getAdminOrder, orderBy, orderWhere } =
  await import("@/features/orders/server/queries");
const { parseAdminOrderFilters } = await import("@/features/orders/params");

describe("admin order queries", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    count.mockResolvedValue(0);
    findMany.mockResolvedValue([]);
    findUnique.mockResolvedValue(null);
  });

  it("protects paginated reads before querying orders", async () => {
    const filters = parseAdminOrderFilters({ page: "9" });
    await listAdminOrders(filters);
    expect(permission).toHaveBeenCalledWith("orders.read");
    expect(permission.mock.invocationCallOrder[0]).toBeLessThan(
      count.mock.invocationCallOrder[0] ?? Infinity,
    );
    expect(findMany).toHaveBeenCalledWith(
      expect.objectContaining({ skip: 0, take: 20 }),
    );
  });

  it("protects order details", async () => {
    await expect(getAdminOrder("order-id")).resolves.toBeNull();
    expect(permission).toHaveBeenCalledWith("orders.read");
    expect(permission.mock.invocationCallOrder[0]).toBeLessThan(
      findUnique.mock.invocationCallOrder[0] ?? Infinity,
    );
  });

  it("builds reference, customer, phone, status and date filters", () => {
    const where = orderWhere(
      parseAdminOrderFilters({
        q: "Pericles",
        status: "PENDING",
        dateFrom: "2026-08-01",
        dateTo: "2026-08-13",
      }),
    );
    expect(where).toMatchObject({
      OR: [
        { reference: { contains: "Pericles", mode: "insensitive" } },
        { customerName: { contains: "Pericles", mode: "insensitive" } },
        { customerPhone: { contains: "Pericles", mode: "insensitive" } },
      ],
      status: "PENDING",
      createdAt: {
        gte: new Date("2026-08-01T00:00:00.000Z"),
        lt: new Date("2026-08-14T00:00:00.000Z"),
      },
    });
  });

  it("maps only approved sort keys", () => {
    expect(orderBy("total-desc")).toEqual([
      { totalMinor: "desc" },
      { id: "asc" },
    ]);
    expect(orderBy("created-desc")).toEqual([
      { createdAt: "desc" },
      { id: "asc" },
    ]);
  });
});
