import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  CheckCircle2,
  CreditCard,
  Package,
  ShoppingCart,
  ShieldCheck,
  Store,
  User,
} from "lucide-react";
import { buttonVariants } from "@/components/ui";

export const metadata: Metadata = {
  title: "How to Order",
  description:
    "Learn how to browse, add to cart, checkout, and confirm your order at MOB GREENS.",
};

const steps = [
  {
    icon: Store,
    title: "Browse Products",
    description:
      "Explore our catalog by category or search for specific items. Each product shows available weights and prices in your preferred currency.",
  },
  {
    icon: ShoppingCart,
    title: "Add to Cart",
    description:
      "Select your preferred weight option and quantity, then add items to your cart. You can review and modify your selections before checkout.",
  },
  {
    icon: User,
    title: "Provide Details",
    description:
      "Enter your name, email, and phone number. Choose between pickup or delivery. No account required - order as a guest.",
  },
  {
    icon: CreditCard,
    title: "Recharge Payment",
    description:
      "Pay using recharge codes. Buy a PaysafeCard from a physical store or purchase online through Startselect, Dundle, Recharge.com, or VidaPlayer.",
  },
  {
    icon: ShieldCheck,
    title: "Submit Order",
    description:
      "Enter your recharge verification code and submit. Your order is created with a unique reference number for tracking.",
  },
  {
    icon: CheckCircle2,
    title: "Order Confirmation",
    description:
      "Receive your order reference immediately. An administrator will verify your payment and update your order status.",
  },
];

export default function HowToOrderPage() {
  return (
    <div className="min-h-dvh bg-background">
      <header className="safe-top border-b border-border">
        <div className="mx-auto max-w-[var(--content-max)] px-3 py-4 sm:px-6 lg:px-8">
          <Link
            href="/"
            className={buttonVariants({ variant: "ghost", size: "small" })}
          >
            <ArrowRight aria-hidden="true" className="mr-2 size-4 rotate-180" />
            Back to catalog
          </Link>
        </div>
      </header>

      <main>
        <div className="mx-auto max-w-[var(--content-max)] px-3 py-8 sm:px-6 sm:py-12 lg:px-8 lg:py-16">
          <div className="mx-auto max-w-2xl">
            <h1 className="heading-page mb-4">How to Order</h1>
            <p className="mb-12 text-lg text-foreground-muted">
              Follow these simple steps to place your order at MOB GREENS.
            </p>

            <div className="space-y-8">
              {steps.map((step, index) => {
                const Icon = step.icon;
                return (
                  <div
                    key={index}
                    className="flex gap-4 rounded-lg border border-border bg-surface p-6"
                  >
                    <div className="shrink-0">
                      <div className="flex size-12 items-center justify-center rounded-full bg-surface-raised">
                        <Icon aria-hidden="true" className="size-6" />
                      </div>
                    </div>
                    <div className="flex-1">
                      <h2 className="heading-section mb-2">{step.title}</h2>
                      <p className="text-foreground-muted">
                        {step.description}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-12 rounded-lg border border-info-subtle bg-info/5 p-6">
              <h3 className="heading-section mb-3 flex items-center gap-2">
                <Package aria-hidden="true" className="size-5" />
                Order Status
              </h3>
              <p className="text-sm text-foreground-muted">
                After submission, your order starts as <strong>PENDING</strong>.
                Once payment is verified, it moves to <strong>CONFIRMED</strong>
                , then
                <strong>PROCESSING</strong>, <strong>READY</strong>, and finally
                <strong>COMPLETED</strong>. You can track your order status
                using your reference number.
              </p>
            </div>

            <div className="mt-8 text-center">
              <Link href="/" className={buttonVariants({ size: "large" })}>
                Start Shopping
                <ArrowRight aria-hidden="true" className="ml-2 size-4" />
              </Link>
            </div>
          </div>
        </div>
      </main>

      <footer className="border-t border-border">
        <div className="mx-auto max-w-[var(--content-max)] px-3 py-8 text-sm text-foreground-muted sm:px-6 lg:px-8">
          © {new Date().getFullYear()} MOB GREENS
        </div>
      </footer>
    </div>
  );
}
