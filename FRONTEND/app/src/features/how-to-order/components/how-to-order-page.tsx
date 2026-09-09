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
import { useTranslations } from "next-intl";
import { StoreHeader } from "@/components/shared/store-header";
import { buttonVariants } from "@/components/ui";
import { RechargePartnerRail } from "@/features/payments/components/recharge-partner-rail";
import { cn } from "@/lib/utils";

const steps = [
  {
    icon: ShoppingBag,
    number: "01",
    titleKey: "step1Title",
    descriptionKey: "step1Description",
  },
  {
    icon: MapPin,
    number: "02",
    titleKey: "step2Title",
    descriptionKey: "step2Description",
  },
  {
    icon: WalletCards,
    number: "03",
    titleKey: "step3Title",
    descriptionKey: "step3Description",
  },
  {
    icon: CheckCircle2,
    number: "04",
    titleKey: "step4Title",
    descriptionKey: "step4Description",
  },
] as const;

const paymentMethods = [
  {
    titleKey: "rechargeFromStore",
    descriptionKey: "rechargeFromStoreDescription",
  },
  {
    titleKey: "rechargeOnline",
    descriptionKey: "rechargeOnlineDescription",
  },
  {
    titleKey: "bitcoin",
    descriptionKey: "bitcoinDescription",
  },
] as const;

const carriedForward = [
  "carriedForward1",
  "carriedForward2",
  "carriedForward3",
] as const;

export function HowToOrderPage() {
  const t = useTranslations("HowToOrder");
  const tNav = useTranslations("Navigation");
  const tCommon = useTranslations("Common");
  return (
    <div className="min-h-dvh bg-background">
      <StoreHeader />

      <main className="mx-auto max-w-[var(--content-max)] px-4 py-5 sm:px-6 sm:py-9 lg:px-8 lg:py-12">
        <section className="overflow-hidden rounded-[1.75rem] border border-border/70 bg-inverse text-inverse-foreground shadow-[0_24px_80px_rgb(0_0_0/0.09)]">
          <div className="relative min-h-[29rem] px-5 py-8 sm:min-h-[31rem] sm:px-8 sm:py-10 lg:min-h-[34rem] lg:px-12 lg:py-14">
            <Image
              src="/images/verification/payment-hero-v1.png"
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
                {t("title")}
              </p>
              <h1 className="mt-4 text-4xl leading-[0.96] font-black tracking-[-0.055em] text-balance sm:text-5xl lg:text-6xl">
                {t("subtitle")}
              </h1>
              <p className="mt-5 max-w-lg text-sm leading-6 text-white/85 sm:text-base sm:leading-7">
                {t("description")}
              </p>
              <div className="mt-7 flex flex-col gap-3 sm:flex-row">
                <Link
                  href="/"
                  className={cn(
                    buttonVariants({ size: "large" }),
                    "bg-white text-neutral-950 hover:bg-white/90",
                  )}
                >
                  {t("startShopping")}
                  <ArrowRight aria-hidden="true" className="size-4" />
                </Link>
                <Link
                  href="/orders"
                  className={cn(
                    buttonVariants({ variant: "secondary", size: "large" }),
                    "border-white/35 bg-white/8 text-white hover:bg-white/14",
                  )}
                >
                  {t("trackOrder")}
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
              {t("journeyTitle")}
            </p>
            <h2
              id="order-journey-title"
              className="mt-2 text-3xl leading-[1.02] font-black tracking-[-0.05em] text-balance sm:text-4xl"
            >
              {t("journeySubtitle")}
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
                    {t(step.titleKey)}
                  </h3>
                  <p className="max-w-xl text-sm leading-6 text-foreground-muted sm:text-base sm:leading-7">
                    {t(step.descriptionKey)}
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
                {t("verificationTitle")}
              </p>
              <h2
                id="verification-handoff-title"
                className="mt-2 text-3xl leading-[1.02] font-black tracking-[-0.05em] text-balance"
              >
                {t("verificationSubtitle")}
              </h2>
            </div>
            <div>
              <p className="max-w-2xl text-sm leading-6 text-foreground-muted sm:text-base sm:leading-7">
                {t("verificationDescription")}
              </p>
              <ul className="mt-5 grid gap-3 sm:grid-cols-3">
                {carriedForward.map((key) => (
                  <li
                    key={key}
                    className="border-l-2 border-info pl-3 text-sm leading-5 font-semibold"
                  >
                    {t(key)}
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
                {t("paymentTitle")}
              </p>
              <h2
                id="payment-methods-title"
                className="mt-2 text-3xl leading-[1.02] font-black tracking-[-0.05em]"
              >
                {t("paymentSubtitle")}
              </h2>
            </div>
            <p className="max-w-md text-sm leading-6 text-foreground-muted">
              {t("paymentDescription")}
            </p>
          </div>
          <div className="mt-8 grid border-y border-border sm:grid-cols-3 sm:divide-x sm:divide-border">
            {paymentMethods.map((method) => (
              <article
                key={method.titleKey}
                className="border-b border-border py-6 last:border-b-0 sm:border-b-0 sm:px-6 sm:py-2 first:sm:pl-0 last:sm:pr-0"
              >
                <h3 className="font-bold tracking-[-0.02em]">{tNav(method.titleKey)}</h3>
                <p className="mt-2 text-sm leading-6 text-foreground-muted">
                  {t(method.descriptionKey)}
                </p>
              </article>
            ))}
          </div>
        </section>

        <section className="mt-14 border-t border-border pt-8 pb-6 sm:mt-20 sm:flex sm:items-end sm:justify-between sm:gap-8 sm:pb-10">
          <div className="max-w-xl">
            <div className="flex items-center gap-2">
              <PackageCheck aria-hidden="true" className="size-5 text-info" />
              <p className="font-bold">{t("afterPaymentTitle")}</p>
            </div>
            <p className="mt-2 text-sm leading-6 text-foreground-muted">
              {t("afterPaymentDescription")}
            </p>
          </div>
          <Link
            href="/"
            className={cn(
              buttonVariants({ size: "large" }),
              "mt-6 shrink-0 sm:mt-0",
            )}
          >
            {t("browseCatalogue")}
            <ArrowRight aria-hidden="true" className="size-4" />
          </Link>
        </section>
      </main>
    </div>
  );
}
