import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  CheckCircle2,
  MapPin,
  PackageCheck,
  ShoppingBag,
  WalletCards,
} from "lucide-react";
import { StoreHeader } from "@/components/shared/store-header";
import { buttonVariants } from "@/components/ui";
import { RechargePartnerRail } from "@/features/payments/components/recharge-partner-rail";
import { cn } from "@/lib/utils";

const steps = [
  {
    icon: ShoppingBag,
    number: "01",
    title: "Choose your products",
    description:
      "Browse the catalogue, select an available option, then review every item in your cart before continuing.",
  },
  {
    icon: MapPin,
    number: "02",
    title: "Confirm the order details",
    description:
      "Add your name and email, then choose pickup or confirm a real delivery location. No customer account is required.",
  },
  {
    icon: WalletCards,
    number: "03",
    title: "Choose how to pay",
    description:
      "Select recharge from store, recharge online, or Bitcoin deposit. The server locks the current cart, total, currency, and selected payment method together.",
  },
  {
    icon: CheckCircle2,
    number: "04",
    title: "Verify and follow the order",
    description:
      "All Verification opens with your real order already loaded. Submit the recharge codes or complete the Bitcoin invoice; delivery matching starts only after payment is confirmed.",
  },
] as const;

const paymentMethods = [
  {
    title: "Recharge from store",
    description: "Use a code bought in person.",
  },
  {
    title: "Recharge online",
    description: "Buy a code from a listed partner.",
  },
  {
    title: "Bitcoin deposit",
    description: "Pay 50% now, rest at delivery.",
  },
] as const;

const carriedForward = [
  "Item images and quantities",
  "Locked total and currency",
  "Selected payment and location",
] as const;

export function HowToOrderPage() {
  return (
    <div className="min-h-dvh bg-background">
      <StoreHeader />

      <main className="mx-auto max-w-[var(--content-max)] px-4 py-5 sm:px-6 sm:py-9 lg:px-8 lg:py-12">
        <section className="overflow-hidden rounded-[1.75rem] border border-border/70 bg-inverse text-inverse-foreground shadow-[0_24px_80px_rgb(0_0_0/0.09)]">
          <div className="relative min-h-[29rem] px-5 py-8 sm:min-h-[31rem] sm:px-8 sm:py-10 lg:min-h-[34rem] lg:px-12 lg:py-14">
            <Image
              src="/images/how-to-order/order-guide-hero-v1.png"
              alt="A neatly packed delivery parcel on a kitchen counter"
              fill
              priority
              sizes="(max-width: 768px) 100vw, min(100vw, var(--content-max))"
              className="object-cover object-[67%_center]"
            />
            <div
              aria-hidden="true"
              className="absolute inset-0 bg-[linear-gradient(90deg,rgb(2_6_12/.7)_0%,rgb(3_13_24/.54)_46%,rgb(2_12_21/.08)_100%)]"
            />
            <div className="relative z-10 flex min-h-[calc(29rem-4rem)] max-w-xl flex-col justify-end sm:min-h-[calc(31rem-5rem)] lg:min-h-[calc(34rem-7rem)]">
              <p className="text-xs font-bold tracking-[0.14em] text-white/80 uppercase">
                How to order
              </p>
              <h1 className="mt-4 text-4xl leading-[0.96] font-black tracking-[-0.055em] text-balance sm:text-5xl lg:text-6xl">
                From cart to confirmed, without losing your place.
              </h1>
              <p className="mt-5 max-w-lg text-sm leading-6 text-white/85 sm:text-base sm:leading-7">
                Your cart, chosen payment method, and confirmed delivery details
                are kept together when you continue to verification.
              </p>
              <div className="mt-7 flex flex-col gap-3 sm:flex-row">
                <Link
                  href="/"
                  className={cn(
                    buttonVariants({ size: "large" }),
                    "bg-white text-neutral-950 hover:bg-white/90",
                  )}
                >
                  Start shopping
                  <ArrowRight aria-hidden="true" className="size-4" />
                </Link>
                <Link
                  href="/orders"
                  className={cn(
                    buttonVariants({ variant: "secondary", size: "large" }),
                    "border-white/35 bg-white/8 text-white hover:bg-white/14",
                  )}
                >
                  Track an order
                </Link>
              </div>
            </div>
          </div>
          <RechargePartnerRail
            title="Recharge directory"
            description="Choose a provider, buy a code, then return to your open checkout."
            className="border-white/12 bg-black/20 text-inverse-foreground [&_p]:text-white/68 [&_span]:text-white"
          />
        </section>

        <section
          aria-labelledby="order-journey-title"
          className="mt-14 sm:mt-20"
        >
          <div className="max-w-2xl">
            <p className="text-xs font-bold tracking-[0.12em] text-info uppercase">
              The order journey
            </p>
            <h2
              id="order-journey-title"
              className="mt-2 text-3xl leading-[1.02] font-black tracking-[-0.05em] text-balance sm:text-4xl"
            >
              Four steps. One connected checkout.
            </h2>
          </div>

          <ol className="mt-8 border-t border-border">
            {steps.map((step) => {
              const Icon = step.icon;
              return (
                <li
                  key={step.number}
                  className="grid gap-4 border-b border-border py-6 sm:grid-cols-[4.5rem_minmax(0,1fr)] sm:gap-6 sm:py-8 lg:grid-cols-[5.5rem_minmax(0,1fr)_minmax(16rem,0.72fr)] lg:items-start"
                >
                  <div className="flex items-center gap-3 sm:block">
                    <span className="text-sm font-bold tracking-[0.08em] text-foreground-subtle">
                      {step.number}
                    </span>
                    <Icon
                      aria-hidden="true"
                      className="size-5 text-foreground-muted sm:mt-3"
                      strokeWidth={1.8}
                    />
                  </div>
                  <h3 className="text-2xl leading-tight font-black tracking-[-0.04em] sm:pt-0.5">
                    {step.title}
                  </h3>
                  <p className="max-w-xl text-sm leading-6 text-foreground-muted sm:text-base sm:leading-7">
                    {step.description}
                  </p>
                </li>
              );
            })}
          </ol>
        </section>

        <section
          aria-labelledby="verification-handoff-title"
          className="mt-14 border-y border-border bg-surface-subtle/45 py-8 sm:mt-20 sm:py-10"
        >
          <div className="grid gap-7 px-5 sm:px-8 lg:grid-cols-[minmax(0,0.88fr)_minmax(0,1.12fr)] lg:items-end lg:gap-12">
            <div>
              <p className="text-xs font-bold tracking-[0.12em] text-info uppercase">
                All Verification
              </p>
              <h2
                id="verification-handoff-title"
                className="mt-2 text-3xl leading-[1.02] font-black tracking-[-0.05em] text-balance"
              >
                The page already knows your order.
              </h2>
            </div>
            <div>
              <p className="max-w-2xl text-sm leading-6 text-foreground-muted sm:text-base sm:leading-7">
                When checkout creates your secure order intent, All Verification
                receives the real items, total, currency, customer details,
                payment choice, partner, and confirmed location. Recharge codes
                remain empty by design.
              </p>
              <ul className="mt-5 grid gap-3 sm:grid-cols-3">
                {carriedForward.map((item) => (
                  <li
                    key={item}
                    className="border-l-2 border-info pl-3 text-sm leading-5 font-semibold"
                  >
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        <section
          aria-labelledby="payment-methods-title"
          className="mt-14 sm:mt-20"
        >
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <p className="text-xs font-bold tracking-[0.12em] text-info uppercase">
                Payment choices
              </p>
              <h2
                id="payment-methods-title"
                className="mt-2 text-3xl leading-[1.02] font-black tracking-[-0.05em]"
              >
                Pick the method that fits.
              </h2>
            </div>
            <p className="max-w-md text-sm leading-6 text-foreground-muted">
              Recharge submissions are reviewed before payment is marked as
              confirmed. Bitcoin progresses only after provider and blockchain
              confirmation.
            </p>
          </div>
          <div className="mt-8 grid border-y border-border sm:grid-cols-3 sm:divide-x sm:divide-border">
            {paymentMethods.map((method) => (
              <article
                key={method.title}
                className="border-b border-border py-6 last:border-b-0 sm:border-b-0 sm:px-6 sm:py-2 first:sm:pl-0 last:sm:pr-0"
              >
                <h3 className="font-bold tracking-[-0.02em]">{method.title}</h3>
                <p className="mt-2 text-sm leading-6 text-foreground-muted">
                  {method.description}
                </p>
              </article>
            ))}
          </div>
        </section>

        <section className="mt-14 border-t border-border pt-8 pb-6 sm:mt-20 sm:flex sm:items-end sm:justify-between sm:gap-8 sm:pb-10">
          <div className="max-w-xl">
            <div className="flex items-center gap-2">
              <PackageCheck aria-hidden="true" className="size-5 text-info" />
              <p className="font-bold">After payment is confirmed</p>
            </div>
            <p className="mt-2 text-sm leading-6 text-foreground-muted">
              Delivery orders can be matched with a nearby delivery profile and
              tracked as they move from processing to out for delivery and
              completed.
            </p>
          </div>
          <Link
            href="/"
            className={cn(
              buttonVariants({ size: "large" }),
              "mt-6 shrink-0 sm:mt-0",
            )}
          >
            Browse the catalogue
            <ArrowRight aria-hidden="true" className="size-4" />
          </Link>
        </section>
      </main>
    </div>
  );
}
