import Link from "next/link";
import { FolderTree } from "lucide-react";
import { PageHeader } from "@/components/admin";
import { EmptyState, buttonVariants } from "@/components/ui";
import { CategoryQueryService } from "@/features/categories/server/queries";
import { ProductForm } from "@/features/products/components/product-form";
import { cn } from "@/lib/utils";
import { requireAdminPermission } from "@/server/auth/authorization";

export default async function NewProductPage() {
  await requireAdminPermission("catalog.write");
  const categories = (
    await new CategoryQueryService().list({ status: "all" })
  ).filter((category) => !category.isArchived);

  return (
    <div className="mx-auto max-w-7xl">
      <PageHeader
        eyebrow="Catalog"
        title="Add product"
        description="Enter the product details, add media and set its selling price."
      />
      {categories.length ? (
        <ProductForm
          mode="create"
          categories={categories.map((category) => ({
            id: category.id,
            name: category.name,
            isActive: category.isActive,
          }))}
        />
      ) : (
        <div className="mt-8">
          <EmptyState
            title="Create a category first"
            description="Every product must belong to a real, non-archived category."
            icon={<FolderTree aria-hidden="true" className="size-5" />}
            action={
              <Link
                href="/admin/categories/new"
                className={cn(buttonVariants())}
              >
                Create category
              </Link>
            }
          />
        </div>
      )}
    </div>
  );
}
