import { generateUniqueCategorySlug } from "@/features/categories/server/slug";
import { executeWrite } from "@/server/core/write-boundary";
import type { CategoryRepository } from "@/server/repositories/contracts";
import { PrismaCategoryRepository } from "@/server/repositories/prisma";
import {
  activateCategorySchema,
  archiveCategorySchema,
  categoryFormSchema,
  reorderCategoriesSchema,
} from "@/server/validation";

interface ImageCleanup {
  cleanupAfterReplacement(publicId: string): Promise<void>;
}

export class CategoryWriteService {
  constructor(
    private readonly repository: CategoryRepository = new PrismaCategoryRepository(),
    private readonly images?: ImageCleanup,
  ) {}

  private async cleanupReplacedImage(publicId: string) {
    const images =
      this.images ??
      new (
        await import("@/server/media/image-management-service")
      ).ImageManagementService();
    await images.cleanupAfterReplacement(publicId);
  }

  create(input: unknown) {
    return executeWrite(
      "category.create",
      categoryFormSchema,
      input,
      async (data) => {
        const slug = await generateUniqueCategorySlug(
          data.name,
          async (candidate) => !(await this.repository.findBySlug(candidate)),
        );
        return this.repository.create({ ...data, slug, position: 0 });
      },
    );
  }

  update(id: string, input: unknown) {
    return executeWrite(
      "category.update",
      categoryFormSchema,
      input,
      async (data) => {
        const current = await this.repository.findById(id);
        if (!current) throw new Error("CATEGORY_NOT_FOUND");
        const slug =
          current.name === data.name
            ? current.slug
            : await generateUniqueCategorySlug(data.name, async (candidate) => {
                const match = await this.repository.findBySlug(candidate);
                return !match || match.id === id;
              });
        const updated = await this.repository.update({ id, ...data, slug });
        if (
          current.imagePublicId &&
          current.imagePublicId !== updated.imagePublicId
        ) {
          await this.cleanupReplacedImage(current.imagePublicId);
        }
        return updated;
      },
    );
  }

  activate(input: unknown) {
    return executeWrite(
      "category.activate",
      activateCategorySchema,
      input,
      ({ id }) => this.repository.activate(id),
    );
  }

  archive(input: unknown) {
    return executeWrite(
      "category.archive",
      archiveCategorySchema,
      input,
      ({ id }) => this.repository.archive(id),
    );
  }

  reorder(input: unknown) {
    return executeWrite(
      "category.reorder",
      reorderCategoriesSchema,
      input,
      ({ categories }) => this.repository.reorder(categories),
    );
  }
}
