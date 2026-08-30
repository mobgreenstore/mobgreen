import { beforeEach, describe, expect, it, vi } from "vitest";

const order = vi.hoisted(() => ({ count: vi.fn(), findMany: vi.fn() }));
const permission = vi.hoisted(() => vi.fn());

vi.mock("server-only", () => ({}));
vi.mock("@/server/db/client", () => ({ prisma: { order } }));
vi.mock("@/server/auth/authorization", () => ({
  requireAdminPermission: permission,
}));

import { listAdminDeliveries } from "@/features/delivery-operations/server/queries";
import type { AdminDeliveryFilters } from "@/features/delivery-operations/types";

const filters: AdminDeliveryFilters = {
  search: "Dublin",
  status: "PROCESSING",
  tracking: "ACTIVE",
  courier: "Maxime",
  sort: "created-desc",
  page: 1,
};

describe("admin delivery queries", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    permission.mockResolvedValue({ id: "admin-id" });
    order.count
      .mockResolvedValueOnce(1)
      .mockResolvedValueOnce(4)
      .mockResolvedValueOnce(1)
      .mockResolvedValueOnce(1)
      .mockResolvedValueOnce(0);
    order.findMany.mockResolvedValue([
      {
        id: "order-id",
        reference: "MG-2026-DELIVERY",
        customerName: "Customer Name",
        deliveryLocality: "Dublin",
        status: "PROCESSING",
        paymentStatus: "PAID",
        courierNameSnapshot: "Maxime97",
        courierDistanceMeters: 1_250,
        courierDurationSeconds: 1_100,
        createdAt: new Date("2026-08-26T00:00:00Z"),
        deliveryTracking: {
          state: "ACTIVE",
          estimatedArrivalAt: new Date("2026-08-26T01:00:00Z"),
        },
      },
    ]);
  });

  it("authorizes reads and returns delivery-only filtered operations data", async () => {
    const result = await listAdminDeliveries(filters);
    expect(permission).toHaveBeenCalledWith("orders.read");
    expect(order.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          fulfillmentType: "DELIVERY",
          archivedAt: null,
          status: "PROCESSING",
          courierNameSnapshot: {
            contains: "Maxime",
            mode: "insensitive",
          },
          deliveryTracking: { is: { state: "ACTIVE" } },
        }),
      }),
    );
    expect(result).toMatchObject({
      totalCount: 1,
      metrics: {
        open: 4,
        outForDelivery: 1,
        activeTracking: 1,
        withoutCourier: 0,
      },
      deliveries: [
        {
          reference: "MG-2026-DELIVERY",
          courierName: "Maxime97",
          trackingState: "ACTIVE",
        },
      ],
    });
  });
});
