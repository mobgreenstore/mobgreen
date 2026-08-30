import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/server/db/client";
import { withTransaction, type DatabaseClient } from "@/server/db/transaction";
import type {
  CategoryListFilters,
  CategoryRepository,
  CreateCategoryInput,
  UpdateCategoryInput,
} from "@/server/repositories/contracts";

function createData(
  input: CreateCategoryInput,
): Prisma.CategoryUncheckedCreateInput {
  return {
    name: input.name,
    slug: input.slug,
    description: input.description ?? null,
    position: input.position,
    displayTone: input.displayTone,
    isActive: input.isActive,
    ...(input.image
      ? {
          imagePublicId: input.image.publicId,
          imageUrl: input.image.url,
          imageAltText: input.image.altText,
          imageWidth: input.image.width,
          imageHeight: input.image.height,
        }
      : {}),
  };
}

function updateData(
  input: Omit<UpdateCategoryInput, "id">,
): Prisma.CategoryUncheckedUpdateInput {
  const data: Prisma.CategoryUncheckedUpdateInput = {};
  if (input.name !== undefined) data.name = input.name;
  if (input.slug !== undefined) data.slug = input.slug;
  if (input.description !== undefined) data.description = input.description;
  if (input.position !== undefined) data.position = input.position;
  if (input.displayTone !== undefined) data.displayTone = input.displayTone;
  if (input.isActive !== undefined) data.isActive = input.isActive;
  if (input.image !== undefined) {
    data.imagePublicId = input.image?.publicId ?? null;
    data.imageUrl = input.image?.url ?? null;
    data.imageAltText = input.image?.altText ?? null;
    data.imageWidth = input.image?.width ?? null;
    data.imageHeight = input.image?.height ?? null;
  }
  return data;
}

function listWhere(filters: CategoryListFilters): Prisma.CategoryWhereInput {
  const search = filters.search?.trim();
  const status = filters.status ?? "all";
  return {
    ...(search
      ? {
          OR: [
            { name: { contains: search, mode: "insensitive" } },
            { slug: { contains: search, mode: "insensitive" } },
            { description: { contains: search, mode: "insensitive" } },
          ],
        }
      : {}),
    ...(status === "active" ? { isActive: true, archivedAt: null } : {}),
    ...(status === "inactive" ? { isActive: false, archivedAt: null } : {}),
    ...(status === "archived" ? { archivedAt: { not: null } } : {}),
  };
}

export class PrismaCategoryRepository implements CategoryRepository {
  constructor(private readonly database: DatabaseClient = prisma) {}
  findById(id: string) {
    return this.database.category.findUnique({ where: { id } });
  }
  findBySlug(slug: string) {
    return this.database.category.findUnique({ where: { slug } });
  }
  list(filters: CategoryListFilters) {
    return this.database.category.findMany({
      where: listWhere(filters),
      include: { _count: { select: { products: true } } },
      orderBy: [{ archivedAt: "asc" }, { position: "asc" }, { name: "asc" }],
    });
  }
  countProducts(id: string) {
    return this.database.product.count({ where: { categoryId: id } });
  }
  create(input: CreateCategoryInput) {
    return this.database.category.create({ data: createData(input) });
  }
  update({ id, ...input }: UpdateCategoryInput) {
    return this.database.category.update({
      where: { id },
      data: updateData(input),
    });
  }
  activate(id: string) {
    return this.database.category.update({
      where: { id },
      data: { isActive: true, archivedAt: null },
    });
  }
  async archive(id: string) {
    return withTransaction(async (transaction) => {
      const productCount = await transaction.product.count({
        where: { categoryId: id },
      });
      if (productCount > 0) throw new Error("CATEGORY_HAS_PRODUCTS");
      return transaction.category.update({
        where: { id },
        data: { isActive: false, archivedAt: new Date() },
      });
    });
  }
  async reorder(items: readonly { id: string; position: number }[]) {
    await withTransaction(async (transaction) => {
      await Promise.all(
        items.map(({ id, position }) =>
          transaction.category.update({ where: { id }, data: { position } }),
        ),
      );
    });
  }
}
