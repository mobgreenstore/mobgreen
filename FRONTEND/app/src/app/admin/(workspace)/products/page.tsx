import Link from "next/link";
import { Package, Plus, Search } from "lucide-react";
import { FilterBar, PageHeader } from "@/components/admin";
import { Money } from "@/components/commerce/money";
import { ResponsiveImage } from "@/components/commerce/responsive-image";
import { WeightDisplay } from "@/components/commerce/weight-display";
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
import { CategoryQueryService } from "@/features/categories/server/queries";
import { ProductRowActions } from "@/features/products/components/product-row-actions";
import { ProductQueryService } from "@/features/products/server/queries";
import { cn } from "@/lib/utils";
import { requireAdminPermission } from "@/server/auth/authorization";

const statuses = ["all", "DRAFT", "ACTIVE", "ARCHIVED"] as const;
const currencies = ["all", "GBP", "EUR", "USD"] as const;
type StatusFilter = (typeof statuses)[number];
type CurrencyFilter = (typeof currencies)[number];

function statusOf(status: "DRAFT" | "ACTIVE" | "ARCHIVED") {
  return status.toLowerCase() as "draft" | "active" | "archived";
}

function ProductPrice({
  product,
}: {
  product: Awaited<ReturnType<ProductQueryService["list"]>>[number];
}) {
  const option =
    product.priceOptions.find((price) => price.isActive) ??
    product.priceOptions[0];
  if (!option) {
    return <span className="text-sm text-foreground-muted">No price</span>;
  }
  return (
    <span className="flex flex-wrap items-baseline gap-1.5 text-sm">
      <Money
        amountMinor={Number(option.priceMinor)}
        currency={option.currency}
        className="font-mono font-semibold"
      />
      <span className="text-foreground-muted">/</span>
      <WeightDisplay
        value={Number(option.weightValue)}
        unit={option.weightUnit}
        className="text-foreground-muted"
      />
    </span>
  );
}

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requireAdminPermission("catalog.read");
  const params = await searchParams;
  const first = (value: string | string[] | undefined) =>
    Array.isArray(value) ? value[0] : value;
  const search = first(params.q)?.trim().slice(0, 160) ?? "";
  const rawStatus = first(params.status);
  const rawCurrency = first(params.currency);
  const rawCategory = first(params.category);
  const status: StatusFilter = statuses.includes(rawStatus as StatusFilter)
    ? (rawStatus as StatusFilter)
    : "all";
  const currency: CurrencyFilter = currencies.includes(
    rawCurrency as CurrencyFilter,
  )
    ? (rawCurrency as CurrencyFilter)
    : "all";

  const categories = (
    await new CategoryQueryService().list({ status: "all" })
  ).filter((category) => !category.isArchived);
  const categoryId = categories.some((category) => category.id === rawCategory)
    ? rawCategory
    : undefined;
  const products = await new ProductQueryService().list({
    search,
    status,
    currency,
    ...(categoryId ? { categoryId } : {}),
  });
  const createdCount = Number(first(params.created));
  const created = Number.isInteger(createdCount) && createdCount > 0;
  const updated = first(params.updated) === "1";

  return (
    <div className="mx-auto max-w-7xl">
      <PageHeader
        title="Products"
        description="Manage real catalog products, Cloudinary images, weights, currencies, and exact prices."
        actions={
          <Link href="/admin/products/new" className={cn(buttonVariants())}>
            <Plus aria-hidden="true" className="size-4" />
            Add products
          </Link>
        }
      />

      {(created || updated) && (
        <InlineAlert
          className="mt-6"
          tone="success"
          title={
            created
              ? `${createdCount} ${createdCount === 1 ? "product" : "products"} created`
              : "Product updated"
          }
          description={
            created
              ? "The complete batch and its pricing options were saved to the real database."
              : "The real database record and its pricing options are saved."
          }
        />
      )}

      <form action="/admin/products" method="get" className="mt-6">
        <FilterBar
          search={
            <TextField
              name="q"
              defaultValue={search}
              placeholder="Search products"
              aria-label="Search products"
              leading={<Search aria-hidden="true" className="size-4" />}
            />
          }
          filters={
            <>
              <Select
                name="category"
                defaultValue={categoryId ?? ""}
                aria-label="Filter by category"
              >
                <option value="">All categories</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </Select>
              <Select
                name="currency"
                defaultValue={currency}
                aria-label="Filter by currency"
              >
                <option value="all">All currencies</option>
                <option value="GBP">GBP</option>
                <option value="EUR">EUR</option>
                <option value="USD">USD</option>
              </Select>
              <Select
                name="status"
                defaultValue={status}
                aria-label="Filter by status"
              >
                <option value="all">All statuses</option>
                <option value="DRAFT">Draft</option>
                <option value="ACTIVE">Active</option>
                <option value="ARCHIVED">Archived</option>
              </Select>
            </>
          }
          actions={
            <button className={cn(buttonVariants({ variant: "secondary" }))}>
              Apply filters
            </button>
          }
        />
      </form>

      <div className="mt-6">
        {products.length === 0 ? (
          <EmptyState
            title={
              search || status !== "all" || currency !== "all" || categoryId
                ? "No matching products"
                : "No products yet"
            }
            description={
              search || status !== "all" || currency !== "all" || categoryId
                ? "Change the product filters and try again."
                : categories.length
                  ? "Create the first real MOB GREENS product."
                  : "Create a category before adding products."
            }
            icon={<Package aria-hidden="true" className="size-5" />}
            action={
              categories.length ? (
                <Link
                  href="/admin/products/new"
                  className={cn(buttonVariants())}
                >
                  <Plus aria-hidden="true" className="size-4" />
                  Add products
                </Link>
              ) : (
                <Link
                  href="/admin/categories/new"
                  className={cn(buttonVariants())}
                >
                  Create category
                </Link>
              )
            }
          />
        ) : (
          <ResponsiveDataView
            table={
              <DataTable>
                <DataTableCaption>Real catalog products</DataTableCaption>
                <DataTableHeader>
                  <DataTableRow>
                    <DataTableHead>Product</DataTableHead>
                    <DataTableHead>Category</DataTableHead>
                    <DataTableHead>Status</DataTableHead>
                    <DataTableHead>Primary price</DataTableHead>
                    <DataTableHead>Currencies</DataTableHead>
                    <DataTableHead>Updated</DataTableHead>
                    <DataTableHead className="text-right">
                      Actions
                    </DataTableHead>
                  </DataTableRow>
                </DataTableHeader>
                <DataTableBody>
                  {products.map((product) => {
                    const cover =
                      product.images.find((image) => image.isCover) ??
                      product.images[0] ??
                      null;
                    return (
                      <DataTableRow key={product.id}>
                        <DataTableCell>
                          <div className="flex min-w-48 items-center gap-3">
                            <ResponsiveImage
                              image={cover}
                              sizes="48px"
                              className="size-12 shrink-0 rounded-md border border-border"
                            />
                            <div>
                              <p className="font-semibold">{product.name}</p>
                              <p className="mt-1 text-xs text-foreground-muted">
                                /{product.slug}
                              </p>
                            </div>
                          </div>
                        </DataTableCell>
                        <DataTableCell>{product.categoryName}</DataTableCell>
                        <DataTableCell>
                          <StatusBadge status={statusOf(product.status)} />
                        </DataTableCell>
                        <DataTableCell>
                          <ProductPrice product={product} />
                        </DataTableCell>
                        <DataTableCell>
                          {product.currencies.length
                            ? product.currencies.join(", ")
                            : "—"}
                        </DataTableCell>
                        <DataTableCell>
                          {new Intl.DateTimeFormat("en", {
                            dateStyle: "medium",
                          }).format(new Date(product.updatedAt))}
                        </DataTableCell>
                        <DataTableCell>
                          <ProductRowActions product={product} />
                        </DataTableCell>
                      </DataTableRow>
                    );
                  })}
                </DataTableBody>
              </DataTable>
            }
            mobile={
              <DataList>
                {products.map((product) => {
                  const cover =
                    product.images.find((image) => image.isCover) ??
                    product.images[0] ??
                    null;
                  return (
                    <DataListItem key={product.id}>
                      <div className="flex items-start gap-3">
                        <ResponsiveImage
                          image={cover}
                          sizes="64px"
                          className="size-16 shrink-0 rounded-md border border-border"
                        />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <h2 className="font-semibold">{product.name}</h2>
                              <p className="mt-1 text-xs text-foreground-muted">
                                {product.categoryName}
                              </p>
                            </div>
                            <StatusBadge status={statusOf(product.status)} />
                          </div>
                          <div className="mt-3">
                            <ProductPrice product={product} />
                          </div>
                        </div>
                      </div>
                      <div className="mt-4 border-t border-border pt-4">
                        <ProductRowActions product={product} />
                      </div>
                    </DataListItem>
                  );
                })}
              </DataList>
            }
          />
        )}
      </div>
    </div>
  );
}
