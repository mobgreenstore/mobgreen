import { beforeEach, describe, expect, it, vi } from "vitest";
import type { SpecialOfferGenerationService } from "@/features/special-offers/server/generation-service";

const database = vi.hoisted(() => {
  const specialOffer = {
    deleteMany: vi.fn(),
    createMany: vi.fn(),
    findMany: vi.fn(),
    findFirst: vi.fn(),
    updateMany: vi.fn(),
  };
  return {
    transaction: specialOffer,
    prisma: {
      category: { findUnique: vi.fn() },
      categoryOfferPolicy: { upsert: vi.fn() },
      productPriceOption: { findUnique: vi.fn(), update: vi.fn() },
      specialOffer: { updateMany: vi.fn() },
      $transaction: vi.fn(
        async (
          operation: (value: { specialOffer: typeof specialOffer }) => unknown,
        ) => operation({ specialOffer }),
      ),
    },
  };
});

vi.mock("@/server/db/client", () => ({ prisma: database.prisma }));

const { SpecialOfferCampaignService } =
  await import("@/features/special-offers/server/campaign-service");

const categoryId = "124bf462-6765-451c-8db8-d47976ec9595";
const generationKey = "419cd6b4-2c1b-40d0-80f8-52a46c652998";
const startsAt = new Date("2026-08-24T10:00:00.000Z");
const endsAt = new Date("2026-08-24T11:00:00.000Z");

const generated = {
  offers: [
    {
      publicId: "offer-public-id",
      generationKey,
      categoryId,
      productId: "548cfdbd-51d4-4bc8-8764-1f15e5296f56",
      priceOptionId: "8b27a663-d233-4e2d-b17d-d301a6b6f90e",
      currency: "EUR" as const,
      bundleQuantity: 4,
      totalWeightGrams: "400",
      originalTotalMinor: 4000n,
      discountBps: 1000,
      discountMinor: 400n,
      offerTotalMinor: 3600n,
      startsAt,
      endsAt,
    },
  ],
  exclusions: [],
};

function service() {
  return new SpecialOfferCampaignService({
    generate: vi.fn().mockResolvedValue(generated),
  } as unknown as SpecialOfferGenerationService);
}

describe("special-offer campaign transactions", () => {
  beforeEach(() => {
    database.transaction.deleteMany.mockResolvedValue({ count: 0 });
    database.transaction.createMany.mockResolvedValue({ count: 1 });
    database.transaction.findFirst.mockResolvedValue(null);
    database.transaction.updateMany.mockResolvedValue({ count: 1 });
  });

  it("persists every generated draft in one serializable transaction", async () => {
    await service().persistDraft({ categoryId, generationKey });
    expect(database.prisma.$transaction).toHaveBeenCalledOnce();
    expect(database.transaction.deleteMany).toHaveBeenCalledBefore(
      database.transaction.createMany,
    );
    expect(database.transaction.createMany).toHaveBeenCalledWith({
      data: [
        expect.objectContaining({ status: "DRAFT", offerTotalMinor: 3600n }),
      ],
    });
  });

  it("rejects activation when an active option overlaps the draft", async () => {
    database.transaction.findMany.mockResolvedValue([
      {
        ...generated.offers[0],
        id: "offer-id",
        status: "DRAFT",
      },
    ]);
    database.transaction.findFirst.mockResolvedValue({ id: "conflict" });
    await expect(
      service().activate({ categoryId, generationKey }),
    ).rejects.toEqual(expect.objectContaining({ code: "CAMPAIGN_OVERLAP" }));
    expect(database.transaction.updateMany).not.toHaveBeenLastCalledWith(
      expect.objectContaining({ data: { status: "ACTIVE" } }),
    );
  });

  it("regenerates by cancelling and inserting inside the same transaction", async () => {
    await service().regenerate({ categoryId, generationKey });
    expect(database.prisma.$transaction).toHaveBeenCalledOnce();
    expect(database.transaction.updateMany).toHaveBeenCalledBefore(
      database.transaction.createMany,
    );
    expect(database.transaction.createMany).toHaveBeenCalledWith({
      data: [expect.objectContaining({ status: "DRAFT" })],
    });
  });
});
