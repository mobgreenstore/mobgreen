import type { Metadata } from "next";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { StoreHeader } from "@/components/shared/store-header";
import { isBitcoinCheckoutConfigured } from "@/features/bitcoin/server/environment";
import { CheckoutForm } from "@/features/checkout/components/checkout-form";

export const metadata: Metadata = {
  title: "Checkout",
  description: "Prepare a MOB GREENS order for recharge verification.",
  robots: { index: false, follow: false },
};

export default function CheckoutPage() {
  return (
    <div className="min-h-dvh bg-background">
      <StoreHeader />
      <main className="mx-auto max-w-[var(--content-max)] px-4 py-6 sm:px-6 sm:py-10 lg:px-8 lg:py-14">
        <Link
          href="/cart"
          className="inline-flex min-h-11 items-center gap-1.5 text-sm font-semibold text-foreground-muted hover:text-foreground"
        >
          <ChevronLeft aria-hidden="true" className="size-4" />
          Back to cart
        </Link>
        <div className="mt-4 mb-8 max-w-3xl">
          <p className="text-sm font-semibold text-foreground-muted">
            Checkout
          </p>
          <h1 className="heading-display mt-2 text-balance">Order details</h1>
          <p className="mt-3 text-sm leading-6 text-foreground-muted sm:text-base">
            Confirm your details and recharge method. No customer account is
            created.
          </p>
        </div>
        <CheckoutForm
          bitcoinCheckoutAvailable={isBitcoinCheckoutConfigured()}
        />
      </main>
    </div>
  );
}
