import Link from "next/link";
import { FolderTree, Plus, Search } from "lucide-react";
import { FilterBar, PageHeader } from "@/components/admin";
import {
  DataList,
  DataListItem,
  DataTable,
  DataTableBody,
  DataTableCaption,
  DataTableCell,
  DataTableHead,
  DataTableHeader,
  DataTableRow,
  EmptyState,
  InlineAlert,
  ResponsiveDataView,
  Select,
  StatusBadge,
  TextField,
  buttonVariants,
} from "@/components/ui";
import { cn } from "@/lib/utils";
import { requireAdminPermission } from "@/server/auth/authorization";
import { CategoryRowActions } from "@/features/categories/components/category-row-actions";
import { CategoryQueryService } from "@/features/categories/server/queries";

const statuses = ["all", "active", "inactive", "archived"] as const;
type StatusFilter = (typeof statuses)[number];

function statusOf(category: { isArchived: boolean; isActive: boolean }) {
  return category.isArchived
    ? "archived"
    : category.isActive
      ? "active"
      : "draft";
}

export default async function CategoriesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requireAdminPermission("catalog.read");
  const params = await searchParams;
  const rawSearch = Array.isArray(params.q) ? params.q[0] : params.q;
  const rawStatus = Array.isArray(params.status)
    ? params.status[0]
    : params.status;
  const search = rawSearch?.trim().slice(0, 120) ?? "";
  const status: StatusFilter = statuses.includes(rawStatus as StatusFilter)
    ? (rawStatus as StatusFilter)
    : "all";
  const categories = await new CategoryQueryService().list({ search, status });
  const created = params.created === "1";
  const updated = params.updated === "1";

  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader
        title="Categories"
        description="Organize the real MOB GREENS catalog. Every record on this page comes from Railway PostgreSQL."
        actions={
          <Link href="/admin/categories/new" className={cn(buttonVariants())}>
            <Plus aria-hidden="true" className="size-4" /> New category
          </Link>
        }
      />

      {(created || updated) && (
        <InlineAlert
          className="mt-6"
          tone="success"
          title={created ? "Category created" : "Category updated"}
          description="The database record is ready for catalog products."
        />
      )}

      <form action="/admin/categories" method="get" className="mt-6">
        <FilterBar
          search={
            <TextField
              name="q"
              defaultValue={search}
              placeholder="Search categories"
              aria-label="Search categories"
              leading={<Search aria-hidden="true" className="size-4" />}
            />
          }
          filters={
            <Select
              name="status"
              defaultValue={status}
              aria-label="Filter by status"
              className="min-w-40"
            >
              <option value="all">All statuses</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="archived">Archived</option>
            </Select>
          }
          actions={
            <button className={cn(buttonVariants({ variant: "secondary" }))}>
              Apply filters
            </button>
          }
        />
      </form>

      <div className="mt-6">
        {categories.length === 0 ? (
          <EmptyState
            title={
              search || status !== "all"
                ? "No matching categories"
                : "No categories yet"
            }
            description={
              search || status !== "all"
                ? "Change the search or status filter and try again."
                : "Create the first real category for your storefront catalog."
            }
            icon={<FolderTree aria-hidden="true" className="size-5" />}
            action={
              !search && status === "all" ? (
                <Link
                  href="/admin/categories/new"
                  className={cn(buttonVariants())}
                >
                  <Plus aria-hidden="true" className="size-4" /> Create category
                </Link>
              ) : undefined
            }
          />
        ) : (
          <ResponsiveDataView
            table={
              <DataTable>
                <DataTableCaption>Real catalog categories</DataTableCaption>
                <DataTableHeader>
                  <DataTableRow>
                    <DataTableHead>Category</DataTableHead>
                    <DataTableHead>Status</DataTableHead>
                    <DataTableHead>Products</DataTableHead>
                    <DataTableHead>Updated</DataTableHead>
                    <DataTableHead className="text-right">
                      Actions
                    </DataTableHead>
                  </DataTableRow>
                </DataTableHeader>
                <DataTableBody>
                  {categories.map((category) => (
                    <DataTableRow key={category.id}>
                      <DataTableCell>
                        <p className="font-semibold">{category.name}</p>
                        <p className="mt-1 text-xs text-foreground-muted">
                          /{category.slug}
                        </p>
                      </DataTableCell>
                      <DataTableCell>
                        <StatusBadge
                          status={statusOf(category)}
                          {...(!category.isArchived && !category.isActive
                            ? { label: "Inactive" }
                            : {})}
                        />
                      </DataTableCell>
                      <DataTableCell>{category.productCount}</DataTableCell>
                      <DataTableCell>
                        {new Intl.DateTimeFormat("en", {
                          dateStyle: "medium",
                        }).format(new Date(category.updatedAt))}
                      </DataTableCell>
                      <DataTableCell>
                        <CategoryRowActions category={category} />
                      </DataTableCell>
                    </DataTableRow>
                  ))}
                </DataTableBody>
              </DataTable>
            }
            mobile={
              <DataList>
                {categories.map((category) => (
                  <DataListItem key={category.id}>
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h2 className="font-semibold">{category.name}</h2>
                        <p className="mt-1 text-xs text-foreground-muted">
                          /{category.slug}
                        </p>
                      </div>
                      <StatusBadge
                        status={statusOf(category)}
                        {...(!category.isArchived && !category.isActive
                          ? { label: "Inactive" }
                          : {})}
                      />
                    </div>
                    <p className="mt-4 text-sm text-foreground-muted">
                      {category.productCount} products
                    </p>
                    <div className="mt-4 border-t border-border pt-4">
                      <CategoryRowActions category={category} />
                    </div>
                  </DataListItem>
                ))}
              </DataList>
            }
          />
        )}
      </div>
    </div>
  );
}
