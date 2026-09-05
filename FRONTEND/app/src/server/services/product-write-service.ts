import { generateUniqueProductSlug } from "@/features/products/server/slug";
import { executeWrite } from "@/server/core/write-boundary";
import type {
  CategoryRepository,
  ProductRepository,
  ProductWithRelations,
} from "@/server/repositories/contracts";
import {
  PrismaCategoryRepository,
  PrismaProductRepository,
} from "@/server/repositories/prisma";
import {
  activateProductSchema,
  archiveProductSchema,
  bulkProductFormSchema,
  draftProductSchema,
  productFormSchema,
} from "@/server/validation";

interface ImageCleanup {
  cleanupAfterReplacement(publicId: string): Promise<void>;
}

interface VideoCleanup {
  cleanupAfterReplacement(publicId: string): Promise<void>;
}

function ensureActivePrice(product: ProductWithRelations) {
  if (!product.priceOptions.some((option) => option.isActive)) {
    throw new Error("PRODUCT_PRICE_REQUIRED");
  }
}

export class ProductWriteService {
  constructor(
    private readonly repository: ProductRepository = new PrismaProductRepository(),
    private readonly categories: CategoryRepository = new PrismaCategoryRepository(),
    private readonly images?: ImageCleanup,
    private readonly videos?: VideoCleanup,
  ) {}

  private async validateCategory(
    categoryId: string,
    status: "DRAFT" | "ACTIVE",
  ) {
    const category = await this.categories.findById(categoryId);
    if (!category) throw new Error("PRODUCT_CATEGORY_NOT_FOUND");
    if (category.archivedAt) throw new Error("PRODUCT_CATEGORY_ARCHIVED");
    if (status === "ACTIVE" && !category.isActive) {
      throw new Error("PRODUCT_CATEGORY_INACTIVE");
    }
  }

  private async cleanupReplacedImages(publicIds: readonly string[]) {
    if (publicIds.length === 0) return;
    const images =
      this.images ??
      new (
        await import("@/server/media/image-management-service")
      ).ImageManagementService();
    await Promise.all(
      publicIds.map((publicId) => images.cleanupAfterReplacement(publicId)),
    );
  }

  private async cleanupReplacedVideo(publicId: string | null) {
    if (!publicId) return;
    const videos =
      this.videos ??
      new (
        await import("@/server/media/video-management-service")
      ).VideoManagementService();
    await videos.cleanupAfterReplacement(publicId);
  }

  create(input: unknown) {
    return executeWrite(
      "product.create",
      productFormSchema,
      input,
      async (data) => {
        await this.validateCategory(data.categoryId, data.status);
        const slug = await generateUniqueProductSlug(
          data.name,
          async (candidate) => !(await this.repository.findBySlug(candidate)),
        );
        return this.repository.create({ ...data, slug });
      },
    );
  }

  createMany(input: unknown) {
    return executeWrite(
      "product.createMany",
      bulkProductFormSchema,
      input,
      async ({ products }) => {
        const reservedSlugs = new Set<string>();
        const prepared = [];
        for (const product of products) {
          await this.validateCategory(product.categoryId, product.status);
          const slug = await generateUniqueProductSlug(
            product.name,
            async (candidate) =>
              !reservedSlugs.has(candidate) &&
              !(await this.repository.findBySlug(candidate)),
          );
          reservedSlugs.add(slug);
          prepared.push({ ...product, slug });
        }
        return this.repository.createMany(prepared);
      },
    );
  }

  update(id: string, input: unknown) {
    return executeWrite(
      "product.update",
      productFormSchema,
      input,
      async (data) => {
        const current = await this.repository.findById(id);
        if (!current) throw new Error("PRODUCT_NOT_FOUND");
        await this.validateCategory(data.categoryId, data.status);
        const slug =
          current.name === data.name
            ? current.slug
            : await generateUniqueProductSlug(data.name, async (candidate) => {
                const match = await this.repository.findBySlug(candidate);
                return !match || match.id === id;
              });
        const updated = await this.repository.update({
          id,
          slug,
          ...data,
        });
        const retained = new Set(
          updated.images.map((image) => image.cloudinaryPublicId),
        );
        await this.cleanupReplacedImages(
          current.images
            .map((image) => image.cloudinaryPublicId)
            .filter((publicId) => !retained.has(publicId)),
        );
        if (
          current.video?.cloudinaryPublicId &&
          current.video.cloudinaryPublicId !== updated.video?.cloudinaryPublicId
        ) {
          await this.cleanupReplacedVideo(current.video.cloudinaryPublicId);
        }
        return updated;
      },
    );
  }

  activate(input: unknown) {
    return executeWrite(
      "product.activate",
      activateProductSchema,
      input,
      async ({ id }) => {
        const current = await this.repository.findById(id);
        if (!current) throw new Error("PRODUCT_NOT_FOUND");
        await this.validateCategory(current.categoryId, "ACTIVE");
        ensureActivePrice(current);
        return this.repository.setStatus(id, "ACTIVE");
      },
    );
  }

  draft(input: unknown) {
    return executeWrite(
      "product.draft",
      draftProductSchema,
      input,
      async ({ id }) => {
        const current = await this.repository.findById(id);
        if (!current) throw new Error("PRODUCT_NOT_FOUND");
        return this.repository.setStatus(id, "DRAFT");
      },
    );
  }

  archive(input: unknown) {
    return executeWrite(
      "product.archive",
      archiveProductSchema,
      input,
      async ({ id }) => {
        const current = await this.repository.findById(id);
        if (!current) throw new Error("PRODUCT_NOT_FOUND");
        return this.repository.archive(id);
      },
    );
  }
}
