import { Prisma, ProductStatus } from "@/generated/prisma/client";
import { prisma } from "@/server/db/client";
import { withTransaction, type DatabaseClient } from "@/server/db/transaction";
import type {
  CreateProductInput,
  ProductListFilters,
  ProductRepository,
  UpdateProductInput,
} from "@/server/repositories/contracts";

const productRelations = {
  category: true,
  images: { orderBy: { position: "asc" as const } },
  priceOptions: { orderBy: { position: "asc" as const } },
};

function imageData(
  images: CreateProductInput["images"],
): Prisma.ProductImageCreateWithoutProductInput[] {
  return images.map((image) => ({ ...image }));
}

function priceData(
  options: CreateProductInput["priceOptions"],
): Prisma.ProductPriceOptionCreateWithoutProductInput[] {
  return options.map((option) => ({
    weightValue: option.weightValue.toString(),
    weightUnit: option.weightUnit,
    currency: option.currency,
    priceMinor: option.priceMinor,
    costMinor: option.costMinor ?? null,
    compareAtPriceMinor: option.compareAtPriceMinor ?? null,
    position: option.position,
    isActive: option.isActive,
  }));
}

function listWhere(filters: ProductListFilters): Prisma.ProductWhereInput {
  const search = filters.search?.trim();
  return {
    ...(search
      ? {
          OR: [
            { name: { contains: search, mode: "insensitive" } },
            { slug: { contains: search, mode: "insensitive" } },
            {
              shortDescription: {
                contains: search,
                mode: "insensitive",
              },
            },
          ],
        }
      : {}),
    ...(filters.categoryId ? { categoryId: filters.categoryId } : {}),
    ...(filters.currency && filters.currency !== "all"
      ? {
          priceOptions: {
            some: { currency: filters.currency },
          },
        }
      : {}),
    ...(filters.status && filters.status !== "all"
      ? { status: filters.status }
      : {}),
  };
}

export class PrismaProductRepository implements ProductRepository {
  constructor(private readonly database: DatabaseClient = prisma) {}

  private write<T>(operation: (database: DatabaseClient) => Promise<T>) {
    if (this.database === prisma) {
      return withTransaction((transaction) => operation(transaction));
    }
    return operation(this.database);
  }

  findById(id: string) {
    return this.database.product.findUnique({
      where: { id },
      include: productRelations,
    });
  }

  findBySlug(slug: string) {
    return this.database.product.findUnique({
      where: { slug },
      include: productRelations,
    });
  }

  list(filters: ProductListFilters) {
    return this.database.product.findMany({
      where: listWhere(filters),
      include: productRelations,
      orderBy: [{ archivedAt: "asc" }, { updatedAt: "desc" }],
    });
  }

  create({ categoryId, images, priceOptions, ...input }: CreateProductInput) {
    return this.write((database) =>
      database.product.create({
        data: {
          ...input,
          description: input.description ?? null,
          category: { connect: { id: categoryId } },
          images: { create: imageData(images) },
          priceOptions: { create: priceData(priceOptions) },
        },
        include: productRelations,
      }),
    );
  }

  createMany(inputs: readonly CreateProductInput[]) {
    return this.write(async (database) => {
      const products = [];
      for (const { categoryId, images, priceOptions, ...input } of inputs) {
        products.push(
          await database.product.create({
            data: {
              ...input,
              description: input.description ?? null,
              category: { connect: { id: categoryId } },
              images: { create: imageData(images) },
              priceOptions: { create: priceData(priceOptions) },
            },
            include: productRelations,
          }),
        );
      }
      return products;
    });
  }

  update({
    id,
    categoryId,
    images,
    priceOptions,
    ...input
  }: UpdateProductInput) {
    return this.write((database) =>
      database.product.update({
        where: { id },
        data: {
          ...input,
          description: input.description ?? null,
          category: { connect: { id: categoryId } },
          images: {
            deleteMany: {},
            create: imageData(images),
          },
          priceOptions: {
            deleteMany: {},
            create: priceData(priceOptions),
          },
        },
        include: productRelations,
      }),
    );
  }

  setStatus(id: string, status: "DRAFT" | "ACTIVE") {
    return this.write((database) =>
      database.product.update({
        where: { id },
        data: {
          status,
          archivedAt: null,
        },
        include: productRelations,
      }),
    );
  }

  archive(id: string) {
    return this.write((database) =>
      database.product.update({
        where: { id },
        data: {
          status: ProductStatus.ARCHIVED,
          archivedAt: new Date(),
        },
        include: productRelations,
      }),
    );
  }
}
