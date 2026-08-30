import type { Metadata } from "next";
import Link from "next/link";
import { CircleCheck, Clock3 } from "lucide-react";
import { StoreHeader } from "@/components/shared/store-header";
import { Card, InlineAlert, buttonVariants } from "@/components/ui";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Order placed",
  robots: { index: false, follow: false },
};

export default async function OrderSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ reference?: string }>;
}) {
  const reference = (await searchParams).reference?.trim() || "Unavailable";
  return (
    <div className="min-h-dvh bg-background">
      <StoreHeader />
      <main className="mx-auto max-w-2xl px-4 py-10 sm:px-6 sm:py-16">
        <Card className="p-6 text-center sm:p-9">
          <div className="mx-auto grid size-12 place-items-center rounded-full bg-success-subtle text-success">
            <CircleCheck aria-hidden="true" className="size-6" />
          </div>
          <p className="mt-5 text-sm font-semibold text-foreground-muted">
            Order placed successfully
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-[-0.04em]">
            Verification is pending
          </h1>
          <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-foreground-muted">
            The administrator received your order and will review the recharge
            code. Payment is not confirmed yet.
          </p>
          <div className="mt-6 rounded-lg border border-border bg-surface-subtle p-5">
            <p className="text-xs font-semibold tracking-[0.1em] text-foreground-subtle uppercase">
              Order reference
            </p>
            <p className="mt-2 font-mono text-xl font-semibold">{reference}</p>
          </div>
          <InlineAlert
            className="mt-5 text-left"
            tone="info"
            title="Keep this reference"
            description="Use it when communicating with the store about your order."
          />
          <div className="mt-7 flex flex-col gap-2 sm:flex-row sm:justify-center">
            {reference !== "Unavailable" && (
              <Link
                href={`/orders/${encodeURIComponent(reference)}`}
                className={cn(buttonVariants())}
              >
                View order
              </Link>
            )}
            <Link
              href="/"
              className={cn(buttonVariants({ variant: "secondary" }))}
            >
              Continue shopping
            </Link>
            <span
              className={cn(
                buttonVariants({ variant: "secondary" }),
                "cursor-default",
              )}
            >
              <Clock3 aria-hidden="true" className="size-4" />
              Payment pending
            </span>
          </div>
        </Card>
      </main>
    </div>
  );
}
