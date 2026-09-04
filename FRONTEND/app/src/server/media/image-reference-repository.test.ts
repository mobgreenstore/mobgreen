import { beforeEach, describe, expect, it, vi } from "vitest";

const category = vi.hoisted(() => ({ findFirst: vi.fn() }));
const productImage = vi.hoisted(() => ({ findUnique: vi.fn() }));
const orderItem = vi.hoisted(() => ({ findFirst: vi.fn() }));

vi.mock("@/server/db/client", () => ({
  prisma: { category, productImage, orderItem },
}));

import { PrismaImageReferenceRepository } from "@/server/media/image-reference-repository";

describe("PrismaImageReferenceRepository", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    category.findFirst.mockResolvedValue(null);
    productImage.findUnique.mockResolvedValue(null);
    orderItem.findFirst.mockResolvedValue(null);
  });

  it("retains product media used by an immutable order snapshot", async () => {
    orderItem.findFirst.mockResolvedValue({ id: "order-item-id" });

    await expect(
      new PrismaImageReferenceRepository().isReferenced(
        "mob-greens/products/order-cover",
      ),
    ).resolves.toBe(true);

    expect(orderItem.findFirst).toHaveBeenCalledWith({
      where: {
        productImagePublicIdSnapshot: "mob-greens/products/order-cover",
      },
      select: { id: true },
    });
  });

  it("allows cleanup only when no live or historical record references an image", async () => {
    await expect(
      new PrismaImageReferenceRepository().isReferenced(
        "mob-greens/products/unreferenced",
      ),
    ).resolves.toBe(false);
  });
});
