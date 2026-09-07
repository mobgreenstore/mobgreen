import { Badge } from "@/components/ui";
import { PageHeader } from "@/components/admin";
import { CategoryForm } from "@/features/categories/components/category-form";
import { requireAdminPermission } from "@/server/auth/authorization";

export const metadata = { title: "New category" };

export default async function NewCategoryPage() {
  await requireAdminPermission("catalog.write");
  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        eyebrow={<Badge tone="neutral">Catalog</Badge>}
        title="Create category"
        description="Name the category, add its storefront image and publish it when ready."
      />
      <CategoryForm mode="create" />
    </div>
  );
}
