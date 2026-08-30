import Link from "next/link";
import { FolderTree } from "lucide-react";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/admin";
import { Card, EmptyState, buttonVariants } from "@/components/ui";
import { CategoryQueryService } from "@/features/categories/server/queries";
import { ProductForm } from "@/features/products/components/product-form";
import { ProductQueryService } from "@/features/products/server/queries";
import { OfferCostForm } from "@/features/special-offers/components/special-offer-admin-panel";
import { getCategoryOfferAdmin } from "@/features/special-offers/server/queries";
import { cn } from "@/lib/utils";
import { requireAdminPermission } from "@/server/auth/authorization";

export default async function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdminPermission("catalog.write");
  const id = (await params).id;
  const [product, allCategories] = await Promise.all([
    new ProductQueryService().get(id),
    new CategoryQueryService().list({ status: "all" }),
  ]);
  if (!product) notFound();
  const offerAdmin = await getCategoryOfferAdmin(product.categoryId);
  const offerProduct = offerAdmin?.products.find(
    (item) => item.id === product.id,
  );
  const categories = allCategories.filter((category) => !category.isArchived);

  return (
    <div className="mx-auto max-w-7xl">
      <PageHeader
        eyebrow="Catalog"
        title={`Edit ${product.name}`}
        description="Update the real product record, images, publishing state, and exact prices."
      />
      {categories.length ? (
        <>
          <ProductForm
            mode="edit"
            product={product}
            categories={categories.map((category) => ({
              id: category.id,
              name: category.name,
              isActive: category.isActive,
            }))}
          />
          {offerAdmin && offerProduct && (
            <Card className="mt-6 grid gap-5 p-5 sm:p-7">
              <div>
                <h2 className="text-base font-semibold">Private offer costs</h2>
                <p className="mt-1 text-sm text-foreground-muted">
                  Add the real unit cost for each existing option. Costs stay
                  private and protect campaign profitability.
                </p>
              </div>
              <div className="grid gap-4 lg:grid-cols-2">
                {offerProduct.priceOptions.map((option) => (
                  <OfferCostForm
                    key={option.id}
                    categoryId={offerAdmin.id}
                    option={option}
                  />
                ))}
              </div>
            </Card>
          )}
        </>
      ) : (
        <div className="mt-8">
          <EmptyState
            title="No available categories"
            description="Create or restore a category before editing this product."
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
