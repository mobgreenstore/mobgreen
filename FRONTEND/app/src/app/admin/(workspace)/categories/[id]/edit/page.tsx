import { notFound } from "next/navigation";
import { Badge } from "@/components/ui";
import { PageHeader } from "@/components/admin";
import { CategoryForm } from "@/features/categories/components/category-form";
import { CategoryQueryService } from "@/features/categories/server/queries";
import { requireAdminPermission } from "@/server/auth/authorization";

export const metadata = { title: "Edit category" };

export default async function EditCategoryPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdminPermission("catalog.write");
  const categoryId = (await params).id;
  const category = await new CategoryQueryService().get(categoryId);
  if (!category) notFound();

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        eyebrow={
          <Badge tone={category.isArchived ? "danger" : "neutral"}>
            {category.isArchived ? "Archived" : "Catalog"}
          </Badge>
        }
        title={`Edit ${category.name}`}
        description={`Database slug: /${category.slug}. Renaming regenerates it safely when needed.`}
      />
      <CategoryForm mode="edit" category={category} />
    </div>
  );
}
