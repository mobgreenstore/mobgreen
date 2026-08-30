import Link from "next/link";
import {
  BadgePercent,
  Clock3,
  Layers3,
  Settings2,
  Sparkles,
} from "lucide-react";
import { MetricCard, PageHeader } from "@/components/admin";
import {
  Badge,
  Button,
  Card,
  EmptyState,
  Pagination,
  TextField,
} from "@/components/ui";
import {
  listAdminOfferCampaigns,
  parseAdminOfferFilters,
  type AdminOfferFilters,
  type AdminOfferStatus,
} from "@/features/special-offers/server/admin-queries";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";

function statusTone(status: AdminOfferStatus) {
  if (status === "ACTIVE") return "success" as const;
  if (status === "DRAFT") return "info" as const;
  if (status === "CANCELLED") return "danger" as const;
  return "neutral" as const;
}

function offerHref(filters: AdminOfferFilters, page: number) {
  const params = new URLSearchParams();
  if (filters.query) params.set("q", filters.query);
  if (filters.status !== "ALL") params.set("status", filters.status);
  if (page > 1) params.set("page", String(page));
  const query = params.toString();
  return query ? `/admin/offers?${query}` : "/admin/offers";
}

export default async function AdminOffersPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const filters = parseAdminOfferFilters(await searchParams);
  const result = await listAdminOfferCampaigns(filters);

  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader
        eyebrow={<Badge tone="info">Revenue controls</Badge>}
        title="Special offers"
        description="Monitor every generated campaign in one place. Pricing, margin protection and campaign lifecycle remain controlled through each category."
        actions={
          <Link
            href="/admin/categories"
            className={cn(buttonVariants({ variant: "secondary" }))}
          >
            <Settings2 aria-hidden="true" className="size-4" />
            Configure categories
          </Link>
        }
      />

      <section
        aria-label="Offer metrics"
        className="mt-8 grid gap-3 sm:grid-cols-2 xl:grid-cols-4"
      >
        <MetricCard
          label="Live campaigns"
          value={result.metrics.active}
          note="Currently customer-visible"
          icon={<Sparkles aria-hidden="true" className="size-5" />}
        />
        <MetricCard
          label="Draft campaigns"
          value={result.metrics.drafts}
          note="Awaiting activation"
          icon={<Layers3 aria-hidden="true" className="size-5" />}
        />
        <MetricCard
          label="Ending within 1 hour"
          value={result.metrics.endingSoon}
          note="Review before expiry"
          icon={<Clock3 aria-hidden="true" className="size-5" />}
        />
        <MetricCard
          label="Enabled categories"
          value={result.metrics.enabledCategories}
          note="Categories allowed to generate offers"
          icon={<BadgePercent aria-hidden="true" className="size-5" />}
        />
      </section>

      <Card className="mt-6 p-4 sm:p-5">
        <form
          action="/admin/offers"
          className="grid gap-3 md:grid-cols-[minmax(0,1fr)_13rem_auto_auto]"
        >
          <TextField
            name="q"
            type="search"
            defaultValue={filters.query}
            placeholder="Search category or product"
            aria-label="Search offer campaigns"
          />
          <select
            name="status"
            defaultValue={filters.status}
            aria-label="Filter by campaign status"
            className="min-h-11 rounded-md border border-border bg-surface px-3 text-sm"
          >
            <option value="ALL">All statuses</option>
            <option value="ACTIVE">Active</option>
            <option value="DRAFT">Draft</option>
            <option value="EXPIRED">Expired</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
          <Button type="submit">Apply filters</Button>
          {(filters.query || filters.status !== "ALL") && (
            <Link
              href="/admin/offers"
              className={cn(buttonVariants({ variant: "ghost" }))}
            >
              Clear
            </Link>
          )}
        </form>
      </Card>

      <section className="mt-6" aria-labelledby="campaign-list-heading">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h2 id="campaign-list-heading" className="text-xl font-bold">
              Campaign history
            </h2>
            <p className="mt-1 text-sm text-foreground-muted">
              {result.pagination.total} campaign
              {result.pagination.total === 1 ? "" : "s"} found
            </p>
          </div>
        </div>

        {result.campaigns.length ? (
          <div className="mt-4 grid gap-3">
            {result.campaigns.map((campaign) => (
              <Card
                key={campaign.generationKey}
                className="grid gap-5 p-5 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center"
              >
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge tone={statusTone(campaign.status)}>
                      {campaign.status.toLowerCase()}
                    </Badge>
                    <span className="text-xs font-semibold text-foreground-muted">
                      {campaign.offerCount} offer
                      {campaign.offerCount === 1 ? "" : "s"}
                    </span>
                    <span className="text-xs text-foreground-subtle">
                      {campaign.currencies.join(", ")}
                    </span>
                  </div>
                  <h3 className="mt-3 text-lg font-bold tracking-[-0.02em]">
                    {campaign.category.name}
                  </h3>
                  <p className="mt-1 truncate text-sm text-foreground-muted">
                    {campaign.products.join(" · ")}
                  </p>
                  <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-sm">
                    <span>
                      Up to{" "}
                      <strong>
                        {(campaign.maximumDiscountBps / 100).toFixed(0)}% off
                      </strong>
                    </span>
                    <span className="text-foreground-muted">
                      Ends {new Date(campaign.endsAt).toLocaleString()}
                    </span>
                  </div>
                </div>
                <Link
                  href={`/admin/categories/${campaign.category.id}/edit#special-offers-heading`}
                  className={cn(
                    buttonVariants({
                      variant:
                        campaign.status === "DRAFT" ? "primary" : "secondary",
                    }),
                    "w-full lg:w-auto",
                  )}
                >
                  Manage campaign
                </Link>
              </Card>
            ))}
          </div>
        ) : (
          <EmptyState
            className="mt-4"
            icon={<BadgePercent aria-hidden="true" className="size-5" />}
            title={
              filters.query || filters.status !== "ALL"
                ? "No campaigns match these filters"
                : "No offer campaigns yet"
            }
            description={
              filters.query || filters.status !== "ALL"
                ? "Clear the filters or try another category or product name."
                : "Enable an offer policy on a category, add valid cost prices, then generate the first campaign."
            }
            action={
              <Link
                href="/admin/categories"
                className={cn(buttonVariants({ variant: "primary" }))}
              >
                Open categories
              </Link>
            }
          />
        )}

        <Pagination
          className="mt-6"
          currentPage={result.pagination.page}
          totalPages={result.pagination.totalPages}
          getHref={(page) => offerHref(filters, page)}
          label="Offer campaign pagination"
        />
      </section>
    </div>
  );
}
