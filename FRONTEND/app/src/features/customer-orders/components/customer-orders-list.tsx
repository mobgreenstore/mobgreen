"use client";

import Link from "next/link";
import { LoaderCircle } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { EmptyState, ErrorState, buttonVariants } from "@/components/ui";
import { CustomerOrderCard } from "@/features/customer-orders/components/customer-order-card";
import type {
  CustomerOrderTab,
  PublicOrderListView,
} from "@/features/customer-orders/types";
import { cn } from "@/lib/utils";

const tabs: Array<{ value: CustomerOrderTab; label: string }> = [
  { value: "active", label: "Active" },
  { value: "pending", label: "Submitted" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
];

export function CustomerOrdersList() {
  const searchParams = useSearchParams();
  const requestedTab = searchParams.get("tab");
  const tab = tabs.some((item) => item.value === requestedTab)
    ? (requestedTab as CustomerOrderTab)
    : "active";
  const page = Math.max(1, Number(searchParams.get("page") ?? "1") || 1);
  const [result, setResult] = useState<PublicOrderListView | null>(null);
  const [error, setError] = useState(false);
  const [retry, setRetry] = useState(0);

  useEffect(() => {
    let active = true;
    fetch(`/api/customer/orders?tab=${tab}&page=${page}`, { cache: "no-store" })
      .then(async (response) => {
        if (!response.ok) throw new Error();
        return (await response.json()) as PublicOrderListView;
      })
      .then((value) => {
        if (active) setResult(value);
      })
      .catch(() => {
        if (active) setError(true);
      });
    return () => {
      active = false;
    };
  }, [page, retry, tab]);

  return (
    <div>
      <nav
        aria-label="Order categories"
        className="flex gap-2 overflow-x-auto pb-2"
      >
        {tabs.map((item) => (
          <Link
            key={item.value}
            href={`/orders?tab=${item.value}`}
            aria-current={tab === item.value ? "page" : undefined}
            className={cn(
              "flex min-h-11 shrink-0 items-center rounded-full px-4 text-sm font-semibold",
              tab === item.value
                ? "bg-inverse text-inverse-foreground"
                : "bg-surface-subtle text-foreground-muted",
            )}
          >
            {item.label}
          </Link>
        ))}
      </nav>
      <div className="mt-6">
        {error ? (
          <ErrorState
            title="Orders could not be loaded"
            description="Retry after checking your connection."
            onRetry={() => {
              setError(false);
              setResult(null);
              setRetry((value) => value + 1);
            }}
          />
        ) : !result ? (
          <p
            role="status"
            className="flex items-center gap-2 py-10 text-sm text-foreground-muted"
          >
            <LoaderCircle className="size-4 animate-spin motion-reduce:animate-none" />
            Loading orders…
          </p>
        ) : result.orders.length === 0 ? (
          <EmptyState
            title={
              tab === "pending" ? "No submitted orders yet" : `No ${tab} orders`
            }
            description="Orders from this browser session will appear here."
          />
        ) : (
          <>
            <div className="grid gap-3 lg:grid-cols-2">
              {result.orders.map((order) => (
                <CustomerOrderCard key={order.reference} order={order} />
              ))}
            </div>
            {result.pageCount > 1 && (
              <div className="mt-6 flex items-center justify-between">
                {result.page > 1 ? (
                  <Link
                    className={buttonVariants({ variant: "secondary" })}
                    href={`/orders?tab=${tab}&page=${result.page - 1}`}
                  >
                    Previous
                  </Link>
                ) : (
                  <span />
                )}
                <span className="text-sm text-foreground-muted">
                  Page {result.page} of {result.pageCount}
                </span>
                {result.page < result.pageCount ? (
                  <Link
                    className={buttonVariants({ variant: "secondary" })}
                    href={`/orders?tab=${tab}&page=${result.page + 1}`}
                  >
                    Next
                  </Link>
                ) : (
                  <span />
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
