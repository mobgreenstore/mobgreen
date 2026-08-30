import type { Metadata } from "next";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { StoreHeader } from "@/components/shared/store-header";
import { CartPage } from "@/features/cart/components/cart-page";

export const metadata: Metadata = {
  title: "Your cart",
  description: "Review current MOB GREENS product prices and availability.",
  robots: { index: false, follow: false },
};

export default function CartRoute() {
  return (
    <div className="min-h-dvh bg-background">
      <StoreHeader />
      <main className="mx-auto max-w-[var(--content-max)] px-4 py-6 sm:px-6 sm:py-10 lg:px-8 lg:py-14">
        <Link
          href="/"
          className="inline-flex min-h-11 items-center gap-1.5 text-sm font-semibold text-foreground-muted hover:text-foreground"
        >
          <ChevronLeft aria-hidden="true" className="size-4" />
          Back to catalog
        </Link>
        <div className="mt-4 mb-8 max-w-2xl">
          <p className="text-sm font-semibold text-foreground-muted">
            Your selections
          </p>
          <h1 className="heading-display mt-2 text-balance">Shopping cart</h1>
          <p className="mt-3 text-sm leading-6 text-foreground-muted sm:text-base">
            Quantities are saved on this device. Prices and availability always
            come from the store.
          </p>
        </div>
        <CartPage />
      </main>
    </div>
  );
}
