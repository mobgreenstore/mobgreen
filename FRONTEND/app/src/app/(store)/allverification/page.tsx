import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, ClipboardCheck, ShoppingBag } from "lucide-react";
import { Card, buttonVariants } from "@/components/ui";
import {
  CheckoutConfirmationRoute,
  confirmationMetadata,
} from "@/features/delivery-matching/components/checkout-confirmation-route";
import { CheckoutPageShell } from "@/features/delivery-matching/components/checkout-page-shell";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  ...confirmationMetadata,
  title: "Verification · MOB GREENS",
};

export default async function AllVerificationPage({
  searchParams,
}: {
  searchParams: Promise<{ intent?: string }>;
}) {
  const params = await searchParams;
  if (params.intent)
    return <CheckoutConfirmationRoute searchParams={Promise.resolve(params)} />;
  return (
    <CheckoutPageShell label="Verification">
      <div className="mx-auto max-w-2xl py-10 sm:py-16">
        <Card className="overflow-hidden p-6 sm:p-10">
          <div className="grid size-12 place-items-center rounded-2xl bg-info-subtle text-info">
            <ClipboardCheck aria-hidden="true" className="size-6" />
          </div>
          <p className="mt-6 text-xs font-bold tracking-[0.14em] text-foreground-subtle uppercase">
            Order verification
          </p>
          <h1 className="mt-2 text-3xl font-black tracking-[-0.04em] sm:text-4xl">
            Nothing is waiting for verification
          </h1>
          <p className="mt-4 max-w-xl text-sm leading-6 text-foreground-muted sm:text-base">
            Start shopping first, then choose a recharge method and weâ bring
            you back here to submit your confirmation securely. Existing orders
            and delivery tracking remain available from your orders page.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link href="/" className={cn(buttonVariants(), "gap-2")}>
              <ShoppingBag aria-hidden="true" className="size-4" />
              Shop the store
              <ArrowRight aria-hidden="true" className="size-4" />
            </Link>
            <Link
              href="/orders"
              className={buttonVariants({ variant: "secondary" })}
            >
              View my orders
            </Link>
          </div>
          <p className="mt-6 border-t border-border pt-5 text-xs leading-5 text-foreground-muted">
            For your protection, a verification page cannot create or confirm an
            order without a server-owned checkout intent. This prevents anyone
            from guessing an order reference or activating delivery without
            verified payment.
          </p>
        </Card>
      </div>
    </CheckoutPageShell>
  );
}
