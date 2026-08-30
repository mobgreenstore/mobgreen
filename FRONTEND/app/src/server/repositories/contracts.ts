import type { z } from "zod";
import type {
  AdminUser,
  Category,
  Order,
  OrderStatusEvent,
  Product,
  ProductImage,
  ProductPriceOption,
  StoreSettings,
} from "@/generated/prisma/client";
import type {
  createAdminUserSchema,
  createCategorySchema,
  createOrderSchema,
  createProductSchema,
  updateCategorySchema,
  updateOrderStatusSchema,
  updateProductSchema,
  updateStoreSettingsSchema,
} from "@/server/validation";

export type CreateAdminUserInput = z.output<typeof createAdminUserSchema>;
export type CreateCategoryInput = z.output<typeof createCategorySchema>;
export type UpdateCategoryInput = z.output<typeof updateCategorySchema>;
export type CreateProductInput = z.output<typeof createProductSchema>;
export type UpdateProductInput = z.output<typeof updateProductSchema>;
export type CreateOrderInput = z.output<typeof createOrderSchema>;
export type UpdateOrderStatusInput = z.output<typeof updateOrderStatusSchema>;
export type UpdateStoreSettingsInput = z.output<
  typeof updateStoreSettingsSchema
>;

export interface AdminUserRepository {
  findById(id: string): Promise<AdminUser | null>;
  findByEmail(email: string): Promise<AdminUser | null>;
  create(input: CreateAdminUserInput): Promise<AdminUser>;
  setActive(id: string, isActive: boolean): Promise<AdminUser>;
  recordSuccessfulLogin(id: string): Promise<AdminUser>;
}

export interface CategoryListFilters {
  search?: string;
  status?: "all" | "active" | "inactive" | "archived";
}

export type CategoryWithProductCount = Category & {
  _count: { products: number };
};

export interface CategoryRepository {
  findById(id: string): Promise<Category | null>;
  findBySlug(slug: string): Promise<Category | null>;
  list(filters: CategoryListFilters): Promise<CategoryWithProductCount[]>;
  countProducts(id: string): Promise<number>;
  create(input: CreateCategoryInput): Promise<Category>;
  update(input: UpdateCategoryInput): Promise<Category>;
  activate(id: string): Promise<Category>;
  archive(id: string): Promise<Category>;
  reorder(items: readonly { id: string; position: number }[]): Promise<void>;
}

export interface ProductListFilters {
  search?: string;
  categoryId?: string;
  currency?: "GBP" | "EUR" | "USD" | "all";
  status?: "DRAFT" | "ACTIVE" | "ARCHIVED" | "all";
}

export type ProductWithRelations = Product & {
  category: Category;
  images: ProductImage[];
  priceOptions: ProductPriceOption[];
};

export interface ProductRepository {
  findById(id: string): Promise<ProductWithRelations | null>;
  findBySlug(slug: string): Promise<ProductWithRelations | null>;
  list(filters: ProductListFilters): Promise<ProductWithRelations[]>;
  create(input: CreateProductInput): Promise<ProductWithRelations>;
  createMany(
    inputs: readonly CreateProductInput[],
  ): Promise<ProductWithRelations[]>;
  update(input: UpdateProductInput): Promise<ProductWithRelations>;
  setStatus(
    id: string,
    status: "DRAFT" | "ACTIVE",
  ): Promise<ProductWithRelations>;
  archive(id: string): Promise<ProductWithRelations>;
}

export interface OrderRepository {
  findById(id: string): Promise<Order | null>;
  findByReference(reference: string): Promise<Order | null>;
  create(input: CreateOrderInput): Promise<Order>;
  updateStatus(
    input: UpdateOrderStatusInput,
  ): Promise<{ order: Order; event: OrderStatusEvent }>;
}

export interface StoreSettingsRepository {
  get(): Promise<StoreSettings | null>;
  upsert(input: UpdateStoreSettingsInput): Promise<StoreSettings>;
}
