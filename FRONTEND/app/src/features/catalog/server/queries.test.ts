import { beforeEach, describe, expect, it, vi } from "vitest";

const database = vi.hoisted(() => ({
  category: { findMany: vi.fn() },
  product: {
    count: vi.fn(),
    findMany: vi.fn(),
    findFirst: vi.fn(),
  },
  specialOffer: { count: vi.fn(), findMany: vi.fn() },
}));

vi.mock("server-only", () => ({}));
vi.mock("next/cache", () => ({
  unstable_cache: (operation: unknown) => operation,
}));
vi.mock("@/server/db/client", () => ({ prisma: database }));

import { getPublicSpecialOffers } from "@/features/special-offers/server/public-queries";
import {
  getCatalogPage,
  getPublicProductBySlug,
} from "@/features/catalog/server/queries";

describe("public catalog queries", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("queries only active records, filters a valid category, and paginates", async () => {
    database.category.findMany.mockResolvedValue([
      {
        id: "category-1",
        name: "Leafy greens",
        slug: "leafy-greens",
        description: "Fresh leaves and vegetables.",
        displayTone: "CHARCOAL",
        imagePublicId:
          "mob-greens/categories/124bf462-6765-451c-8db8-d47976ec9595",
        imageUrl:
          "https://res.cloudinary.com/demo/image/upload/leafy-greens.webp",
        imageAltText: "A basket of leafy green vegetables",
        imageWidth: 1200,
        imageHeight: 1500,
        _count: { products: 4 },
      },
    ]);
    database.product.count.mockResolvedValue(13);
    database.product.findMany.mockResolvedValue([
      {
        id: "product-1",
        slug: "fresh-kale",
        name: "Fresh kale",
        category: { name: "Leafy greens" },
        images: [
          {
            id: "image-1",
            url: "https://example.com/kale.jpg",
            altText: "Fresh kale leaves",
            width: 800,
            height: 800,
            isCover: true,
          },
        ],
        priceOptions: [
          {
            id: "price-1",
            weightValue: 500,
            weightUnit: "GRAM",
            currency: "GBP",
            priceMinor: 1250n,
          },
        ],
      },
    ]);

    const result = await getCatalogPage({
      categorySlug: "leafy-greens",
      search: "fresh kale",
      sort: "name-asc",
      page: 2,
    });

    expect(database.category.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { isActive: true, archivedAt: null },
      }),
    );
    expect(database.product.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        skip: 12,
        take: 12,
        where: expect.objectContaining({
          status: "ACTIVE",
          archivedAt: null,
          categoryId: "category-1",
        }),
      }),
    );
    expect(result).toMatchObject({
      page: 2,
      pageSize: 12,
      totalCount: 13,
      totalPages: 2,
      categories: [
        {
          slug: "leafy-greens",
          displayTone: "CHARCOAL",
          productCount: 4,
          image: {
            url: "https://res.cloudinary.com/demo/image/upload/leafy-greens.webp",
            altText: "A basket of leafy green vegetables",
          },
        },
      ],
      products: [
        {
          slug: "fresh-kale",
          categoryName: "Leafy greens",
          primaryPrice: {
            currency: "GBP",
            priceMinor: 1250,
            weightValue: 500,
          },
        },
      ],
    });
  });

  it("does not apply an unknown category and returns no inactive product", async () => {
    database.category.findMany.mockResolvedValue([]);
    database.product.count.mockResolvedValue(0);
    database.product.findMany.mockResolvedValue([]);
    database.product.findFirst.mockResolvedValue(null);

    await getCatalogPage({
      categorySlug: "unknown",
      search: "",
      sort: "newest",
      page: 1,
    });
    const detail = await getPublicProductBySlug("inactive-product");

    expect(database.product.count).toHaveBeenCalledWith({
      where: expect.not.objectContaining({ categoryId: expect.anything() }),
    });
    expect(database.product.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          slug: "inactive-product",
          status: "ACTIVE",
          archivedAt: null,
        }),
      }),
    );
    expect(detail).toBeNull();
  });
  it("returns only live offers through a typed public view model", async () => {
    database.specialOffer.count.mockResolvedValue(1);
    database.specialOffer.findMany.mockResolvedValue([
      {
        publicId: "a".repeat(32),
        category: { slug: "leafy-greens" },
        productId: "product-1",
        product: {
          slug: "fresh-kale",
          name: "Fresh kale",
          images: [],
        },
        priceOptionId: "price-1",
        currency: "EUR",
        bundleQuantity: 2,
        totalWeightGrams: 1000n,
        originalTotalMinor: 2500n,
        discountBps: 1000,
        discountMinor: 250n,
        offerTotalMinor: 2250n,
        startsAt: new Date("2026-08-26T00:00:00Z"),
        endsAt: new Date("2026-08-26T12:00:00Z"),
      },
    ]);

    const result = await getPublicSpecialOffers({
      categorySlug: "leafy-greens",
      page: 1,
    });

    expect(database.specialOffer.count).toHaveBeenCalledWith({
      where: expect.objectContaining({
        status: "ACTIVE",
        startsAt: { lte: expect.any(Date) },
        endsAt: { gt: expect.any(Date) },
        archivedAt: null,
        category: expect.objectContaining({
          slug: "leafy-greens",
          isActive: true,
          archivedAt: null,
          offerPolicy: { enabled: true },
        }),
        product: { status: "ACTIVE", archivedAt: null },
        priceOption: { isActive: true, archivedAt: null },
      }),
    });
    expect(result).toMatchObject({
      totalCount: 1,
      offers: [
        {
          publicId: "a".repeat(32),
          categorySlug: "leafy-greens",
          productName: "Fresh kale",
          currency: "EUR",
          totalWeightGrams: "1000",
          originalTotalMinor: 2500,
          offerTotalMinor: 2250,
          discountBps: 1000,
        },
      ],
    });
  });
});
