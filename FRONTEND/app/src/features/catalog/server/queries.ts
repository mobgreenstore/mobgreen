import "server-only";

import { unstable_cache } from "next/cache";
import type { Prisma } from "@/generated/prisma/client";
import type {
  CatalogPageViewModel,
  CatalogProductCardViewModel,
  CatalogProductDetailViewModel,
  CatalogSort,
} from "@/features/catalog/types";
import { prisma } from "@/server/db/client";

const CATALOG_PAGE_SIZE = 12;
const CATALOG_CACHE_SECONDS = 300;

const activeCategoryWhere: Prisma.CategoryWhereInput = {
  isActive: true,
  archivedAt: null,
};

const activeProductWhere: Prisma.ProductWhereInput = {
  status: "ACTIVE",
  archivedAt: null,
  category: activeCategoryWhere,
  priceOptions: {
    some: { isActive: true, archivedAt: null },
  },
};

const activePriceWhere: Prisma.ProductPriceOptionWhereInput = {
  isActive: true,
  archivedAt: null,
};

function sortOrder(
  sort: CatalogSort,
): Prisma.ProductOrderByWithRelationInput[] {
  if (sort === "name-asc") return [{ name: "asc" }, { id: "asc" }];
  if (sort === "name-desc") return [{ name: "desc" }, { id: "asc" }];
  return [{ updatedAt: "desc" }, { id: "asc" }];
}

function searchWhere(search: string): Prisma.ProductWhereInput {
  if (!search) return {};
  const terms = search.split(" ").filter(Boolean);
  return {
    AND: terms.map((term) => ({
      OR: [
        { name: { contains: term, mode: "insensitive" } },
        { shortDescription: { contains: term, mode: "insensitive" } },
        { description: { contains: term, mode: "insensitive" } },
        {
          category: {
            name: { contains: term, mode: "insensitive" },
          },
        },
      ],
    })),
  };
}

function imageView(image: {
  id: string;
  url: string;
  altText: string;
  width: number;
  height: number;
}) {
  return {
    id: image.id,
    url: image.url,
    altText: image.altText,
    width: image.width,
    height: image.height,
  };
}

export const getCatalogPage = unstable_cache(
  async (input: {
    categorySlug: string;
    search: string;
    sort: CatalogSort;
    page: number;
  }): Promise<CatalogPageViewModel> => {
    const now = new Date();
    const categoryRecords = await prisma.category.findMany({
      where: activeCategoryWhere,
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        displayTone: true,
        imagePublicId: true,
        imageUrl: true,
        imageAltText: true,
        imageWidth: true,
        imageHeight: true,
        specialOffers: {
          where: {
            status: "ACTIVE",
            startsAt: { lte: now },
            endsAt: { gt: now },
            archivedAt: null,
            product: { status: "ACTIVE", archivedAt: null },
            priceOption: { isActive: true, archivedAt: null },
          },
          orderBy: [
            { discountBps: "desc" as const },
            { totalWeightGrams: "asc" as const },
          ],
          take: 1,
          select: {
            publicId: true,
            discountBps: true,
            totalWeightGrams: true,
            endsAt: true,
          },
        },
        _count: {
          select: {
            products: {
              where: {
                status: "ACTIVE",
                archivedAt: null,
                priceOptions: {
                  some: { isActive: true, archivedAt: null },
                },
              },
            },
          },
        },
      },
      orderBy: [{ position: "asc" }, { name: "asc" }],
    });

    const categories: CatalogPageViewModel["categories"] = categoryRecords.map(
      (category) => ({
        id: category.id,
        name: category.name,
        slug: category.slug,
        description: category.description,
        displayTone: category.displayTone,
        image:
          category.imagePublicId &&
          category.imageUrl &&
          category.imageAltText &&
          category.imageWidth &&
          category.imageHeight
            ? {
                id: category.imagePublicId,
                url: category.imageUrl,
                altText: category.imageAltText,
                width: category.imageWidth,
                height: category.imageHeight,
              }
            : null,
        productCount: category._count.products,
        strongestOffer: category.specialOffers?.[0]
          ? {
              publicId: category.specialOffers?.[0].publicId,
              discountBps: category.specialOffers?.[0].discountBps,
              totalWeightGrams:
                category.specialOffers?.[0].totalWeightGrams.toString(),
              endsAt: category.specialOffers?.[0].endsAt.toISOString(),
            }
          : null,
      }),
    );

    const validCategory = categories.find(
      (category) => category.slug === input.categorySlug,
    );
    const where: Prisma.ProductWhereInput = {
      ...activeProductWhere,
      ...searchWhere(input.search),
      ...(validCategory ? { categoryId: validCategory.id } : {}),
    };
    const totalCount = await prisma.product.count({ where });
    const totalPages = Math.max(1, Math.ceil(totalCount / CATALOG_PAGE_SIZE));
    const page = Math.min(input.page, totalPages);
    const products = await prisma.product.findMany({
      where,
      select: {
        id: true,
        slug: true,
        name: true,
        category: { select: { name: true } },
        images: {
          select: {
            id: true,
            url: true,
            altText: true,
            width: true,
            height: true,
            isCover: true,
          },
          orderBy: { position: "asc" },
        },
        priceOptions: {
          where: activePriceWhere,
          select: {
            id: true,
            weightValue: true,
            weightUnit: true,
            currency: true,
            priceMinor: true,
          },
          orderBy: { position: "asc" },
        },
      },
      orderBy: sortOrder(input.sort),
      skip: (page - 1) * CATALOG_PAGE_SIZE,
      take: CATALOG_PAGE_SIZE,
    });

    const cards: CatalogProductCardViewModel[] = products.flatMap((product) => {
      const price = product.priceOptions[0];
      if (!price) return [];
      const cover =
        product.images.find((image) => image.isCover) ??
        product.images[0] ??
        null;
      return [
        {
          id: product.id,
          slug: product.slug,
          name: product.name,
          categoryName: product.category.name,
          coverImage: cover ? imageView(cover) : null,
          primaryPrice: {
            id: price.id,
            weightValue: Number(price.weightValue),
            weightUnit: price.weightUnit,
            currency: price.currency,
            priceMinor: Number(price.priceMinor),
            available: true,
          },
        },
      ];
    });

    return {
      categories,
      products: cards,
      page,
      pageSize: CATALOG_PAGE_SIZE,
      totalCount,
      totalPages,
    };
  },
  ["public-catalog-page"],
  { tags: ["catalog"], revalidate: CATALOG_CACHE_SECONDS },
);

export const getPublicProductBySlug = unstable_cache(
  async (slug: string): Promise<CatalogProductDetailViewModel | null> => {
    const product = await prisma.product.findFirst({
      where: {
        ...activeProductWhere,
        slug,
      },
      select: {
        id: true,
        slug: true,
        name: true,
        shortDescription: true,
        description: true,
        category: { select: { name: true, slug: true } },
        images: {
          select: {
            id: true,
            url: true,
            altText: true,
            width: true,
            height: true,
          },
          orderBy: { position: "asc" },
        },
        priceOptions: {
          where: activePriceWhere,
          select: {
            id: true,
            weightValue: true,
            weightUnit: true,
            currency: true,
            priceMinor: true,
          },
          orderBy: { position: "asc" },
        },
      },
    });
    if (!product || product.priceOptions.length === 0) return null;
    return {
      id: product.id,
      slug: product.slug,
      name: product.name,
      categoryName: product.category.name,
      categorySlug: product.category.slug,
      shortDescription: product.shortDescription,
      description: product.description,
      images: product.images.map(imageView),
      priceOptions: product.priceOptions.map((option) => ({
        id: option.id,
        weightValue: Number(option.weightValue),
        weightUnit: option.weightUnit,
        currency: option.currency,
        priceMinor: Number(option.priceMinor),
        available: true,
      })),
    };
  },
  ["public-product-by-slug"],
  { tags: ["catalog"], revalidate: CATALOG_CACHE_SECONDS },
);
