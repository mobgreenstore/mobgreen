import { Prisma } from "@/generated/prisma/client";
import type {
  Category,
  ProductImage,
  ProductPriceOption,
  ProductVideo,
} from "@/generated/prisma/client";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/server/repositories/prisma", () => ({
  PrismaProductRepository: class {},
  PrismaCategoryRepository: class {},
}));

import type {
  CategoryRepository,
  ProductRepository,
  ProductWithRelations,
} from "@/server/repositories/contracts";
import { ProductWriteService } from "@/server/services/product-write-service";

const now = new Date("2026-01-01T00:00:00.000Z");
const category: Category = {
  id: "124bf462-6765-451c-8db8-d47976ec9595",
  name: "Leafy greens",
  slug: "leafy-greens",
  description: null,
  imagePublicId: null,
  imageUrl: null,
  imageAltText: null,
  imageWidth: null,
  imageHeight: null,
  position: 0,
  displayTone: "MIST",
  isActive: true,
  archivedAt: null,
  createdAt: now,
  updatedAt: now,
};
const price: ProductPriceOption = {
  id: "324bf462-6765-451c-8db8-d47976ec9595",
  productId: "224bf462-6765-451c-8db8-d47976ec9595",
  weightValue: new Prisma.Decimal("500"),
  weightUnit: "G",
  currency: "GBP",
  priceMinor: 250n,
  compareAtPriceMinor: null,
  costMinor: null,
  position: 0,
  isActive: true,
  archivedAt: null,
  createdAt: now,
  updatedAt: now,
};
const product: ProductWithRelations = {
  id: "224bf462-6765-451c-8db8-d47976ec9595",
  categoryId: category.id,
  name: "Spinach",
  slug: "spinach",
  shortDescription: "Fresh spinach",
  description: null,
  status: "ACTIVE",
  archivedAt: null,
  createdAt: now,
  updatedAt: now,
  category,
  images: [],
  video: null,
  priceOptions: [price],
};

function productRepository(): ProductRepository {
  return {
    findById: vi.fn().mockResolvedValue(product),
    findBySlug: vi.fn().mockResolvedValue(null),
    list: vi.fn().mockResolvedValue([]),
    create: vi.fn().mockResolvedValue(product),
    createMany: vi.fn().mockResolvedValue([product]),
    update: vi.fn().mockResolvedValue(product),
    setStatus: vi.fn().mockResolvedValue(product),
    archive: vi.fn().mockResolvedValue(product),
  };
}

function categoryRepository(): CategoryRepository {
  return {
    findById: vi.fn().mockResolvedValue(category),
    findBySlug: vi.fn(),
    list: vi.fn(),
    countProducts: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    activate: vi.fn(),
    archive: vi.fn(),
    reorder: vi.fn(),
  };
}

describe("ProductWriteService", () => {
  it("preserves explicit currency prices as integer minor units", async () => {
    const products = productRepository();
    const categories = categoryRepository();
    const service = new ProductWriteService(products, categories);
    const result = await service.create({
      categoryId: category.id,
      name: "Spinach",
      shortDescription: "Fresh spinach",
      status: "ACTIVE",
      images: [],
      priceOptions: [
        {
          weightValue: 500,
          weightUnit: "G",
          currency: "GBP",
          priceMinor: 250n,
          position: 0,
          isActive: true,
        },
        {
          weightValue: 500,
          weightUnit: "G",
          currency: "EUR",
          priceMinor: 300n,
          position: 1,
          isActive: true,
        },
      ],
    });

    expect(result.ok).toBe(true);
    expect(products.create).toHaveBeenCalledWith(
      expect.objectContaining({
        slug: "spinach",
        priceOptions: [
          expect.objectContaining({ currency: "GBP", priceMinor: 250n }),
          expect.objectContaining({ currency: "EUR", priceMinor: 300n }),
        ],
      }),
    );
  });

  it("prepares unique slugs and submits one repository batch", async () => {
    const products = productRepository();
    const categories = categoryRepository();
    const service = new ProductWriteService(products, categories);
    const result = await service.createMany({
      products: [
        {
          categoryId: category.id,
          name: "Spinach",
          shortDescription: "First spinach",
          status: "DRAFT",
          images: [],
          priceOptions: [],
        },
        {
          categoryId: category.id,
          name: "Spinach",
          shortDescription: "Second spinach",
          status: "DRAFT",
          images: [],
          priceOptions: [],
        },
      ],
    });

    expect(result.ok).toBe(true);
    expect(products.createMany).toHaveBeenCalledTimes(1);
    expect(products.createMany).toHaveBeenCalledWith([
      expect.objectContaining({ slug: "spinach" }),
      expect.objectContaining({ slug: "spinach-2" }),
    ]);
  });

  it("rejects a product relationship to a missing category", async () => {
    const products = productRepository();
    const categories = categoryRepository();
    vi.mocked(categories.findById).mockResolvedValue(null);
    const service = new ProductWriteService(products, categories);
    const result = await service.create({
      categoryId: category.id,
      name: "Spinach",
      shortDescription: "Fresh spinach",
      status: "DRAFT",
      images: [],
      priceOptions: [],
    });

    expect(result).toMatchObject({
      ok: false,
      error: { message: "Choose an existing category." },
    });
    expect(products.create).not.toHaveBeenCalled();
  });

  it("blocks activation without an active price option", async () => {
    const products = productRepository();
    vi.mocked(products.findById).mockResolvedValue({
      ...product,
      priceOptions: [],
    });
    const service = new ProductWriteService(products, categoryRepository());
    const result = await service.activate({ id: product.id });

    expect(result).toMatchObject({
      ok: false,
      error: {
        message:
          "Add at least one active price before activating this product.",
      },
    });
    expect(products.setStatus).not.toHaveBeenCalled();
  });

  it("cleans removed Cloudinary images only after the transactional update", async () => {
    const oldImage: ProductImage = {
      id: "424bf462-6765-451c-8db8-d47976ec9595",
      productId: product.id,
      cloudinaryPublicId:
        "mob-greens/products/524bf462-6765-451c-8db8-d47976ec9595",
      url: "https://res.cloudinary.com/demo/image/upload/old.webp",
      altText: "Old spinach image",
      width: 800,
      height: 600,
      position: 0,
      isCover: true,
      createdAt: now,
      updatedAt: now,
    };
    const newImage: ProductImage = {
      ...oldImage,
      id: "624bf462-6765-451c-8db8-d47976ec9595",
      cloudinaryPublicId:
        "mob-greens/products/724bf462-6765-451c-8db8-d47976ec9595",
      url: "https://res.cloudinary.com/demo/image/upload/new.webp",
      altText: "New spinach image",
    };
    const products = productRepository();
    vi.mocked(products.findById).mockResolvedValue({
      ...product,
      images: [oldImage],
    });
    vi.mocked(products.update).mockResolvedValue({
      ...product,
      images: [newImage],
    });
    const cleanupAfterReplacement = vi.fn().mockResolvedValue(undefined);
    const service = new ProductWriteService(products, categoryRepository(), {
      cleanupAfterReplacement,
    });

    const result = await service.update(product.id, {
      categoryId: category.id,
      name: product.name,
      shortDescription: product.shortDescription,
      status: "ACTIVE",
      images: [
        {
          cloudinaryPublicId: newImage.cloudinaryPublicId,
          url: newImage.url,
          altText: newImage.altText,
          width: newImage.width,
          height: newImage.height,
          position: 0,
          isCover: true,
        },
      ],
      priceOptions: [
        {
          weightValue: 500,
          weightUnit: "G",
          currency: "GBP",
          priceMinor: 250n,
          position: 0,
          isActive: true,
        },
      ],
    });

    expect(result.ok).toBe(true);
    expect(vi.mocked(products.update).mock.invocationCallOrder[0]).toBeLessThan(
      cleanupAfterReplacement.mock.invocationCallOrder[0] ?? Infinity,
    );
    expect(cleanupAfterReplacement).toHaveBeenCalledWith(
      oldImage.cloudinaryPublicId,
    );
  });

  it("cleans a replaced product video only after the database update", async () => {
    const oldVideo: ProductVideo = {
      id: "824bf462-6765-451c-8db8-d47976ec9595",
      productId: product.id,
      cloudinaryPublicId:
        "mob-greens/products/videos/924bf462-6765-451c-8db8-d47976ec9595",
      url: "https://res.cloudinary.com/demo/video/upload/old.mp4",
      posterUrl: "https://res.cloudinary.com/demo/video/upload/old.jpg",
      altText: "Old spinach video",
      width: 1280,
      height: 720,
      durationSeconds: 12,
      createdAt: now,
      updatedAt: now,
    };
    const newVideo: ProductVideo = {
      ...oldVideo,
      id: "a24bf462-6765-451c-8db8-d47976ec9595",
      cloudinaryPublicId:
        "mob-greens/products/videos/b24bf462-6765-451c-8db8-d47976ec9595",
      url: "https://res.cloudinary.com/demo/video/upload/new.mp4",
      posterUrl: "https://res.cloudinary.com/demo/video/upload/new.jpg",
      altText: "New spinach video",
    };
    const products = productRepository();
    vi.mocked(products.findById).mockResolvedValue({
      ...product,
      video: oldVideo,
    });
    vi.mocked(products.update).mockResolvedValue({
      ...product,
      video: newVideo,
    });
    const cleanupAfterReplacement = vi.fn().mockResolvedValue(undefined);
    const service = new ProductWriteService(
      products,
      categoryRepository(),
      undefined,
      { cleanupAfterReplacement },
    );

    const result = await service.update(product.id, {
      categoryId: category.id,
      name: product.name,
      shortDescription: product.shortDescription,
      status: "ACTIVE",
      images: [],
      video: {
        cloudinaryPublicId: newVideo.cloudinaryPublicId,
        url: newVideo.url,
        posterUrl: newVideo.posterUrl,
        altText: newVideo.altText,
        width: newVideo.width,
        height: newVideo.height,
        durationSeconds: newVideo.durationSeconds,
      },
      priceOptions: [
        {
          weightValue: 500,
          weightUnit: "G",
          currency: "GBP",
          priceMinor: 250n,
          position: 0,
          isActive: true,
        },
      ],
    });

    expect(result.ok).toBe(true);
    expect(vi.mocked(products.update).mock.invocationCallOrder[0]).toBeLessThan(
      cleanupAfterReplacement.mock.invocationCallOrder[0] ?? Infinity,
    );
    expect(cleanupAfterReplacement).toHaveBeenCalledWith(
      oldVideo.cloudinaryPublicId,
    );
  });
});
