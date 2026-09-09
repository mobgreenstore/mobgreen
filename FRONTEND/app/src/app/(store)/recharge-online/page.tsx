import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, ArrowRight, ShieldCheck } from "lucide-react";
import { useTranslations } from "next-intl";
import { BrandMark } from "@/components/shared/brand-mark";
import { buttonVariants } from "@/components/ui";
import { RECHARGE_PARTNERS } from "@/config/recharge";
import { RechargePartnerCard } from "@/features/recharge/components/recharge-partner-card";

export const metadata: Metadata = {
  title: "Recharge online",
  description:
    "Choose an approved external recharge partner, purchase a code, and return to MOB GREENS checkout.",
};

function RechargeContent() {
  const t = useTranslations("Recharge");
  return (
    <div className="min-h-dvh bg-background">
      <header className="safe-top border-b border-border bg-surface">
        <div className="mx-auto flex max-w-[var(--content-max)] items-center justify-between gap-3 px-3 py-3 sm:px-6 lg:px-8">
          <BrandMark />
          <Link
            href="/"
            className={buttonVariants({ variant: "ghost", size: "small" })}
          >
            <ArrowLeft aria-hidden="true" className="size-4" />
            {t("catalog")}
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-[var(--content-max)] px-3 py-6 sm:px-6 sm:py-10 lg:px-8">
        <div className="mx-auto max-w-2xl">
          <div className="rounded-2xl bg-surface-subtle px-5 py-6 sm:px-7 sm:py-8">
            <p className="text-xs font-semibold tracking-[0.1em] text-foreground-subtle uppercase">
              {t("title")}
            </p>
            <h1 className="mt-2 max-w-xl text-3xl leading-[1.05] font-semibold tracking-[-0.05em] text-balance sm:text-4xl">
              {t("choosePartner")}
            </h1>
            <p className="mt-3 max-w-xl text-sm leading-6 text-foreground-muted sm:text-base">
              {t("partnerDescription")}
            </p>
            <div className="mt-5 flex items-center gap-2 text-xs font-medium text-foreground-muted">
              <ShieldCheck aria-hidden="true" className="size-4" />
              {t("cardDetailsSafe")}
            </div>
          </div>

          <section aria-labelledby="recharge-partners" className="mt-7 sm:mt-9">
            <h2
              id="recharge-partners"
              className="text-lg font-semibold tracking-[-0.025em]"
            >
              {t("approvedPartners")}
            </h2>
            <div className="mt-3 grid grid-cols-2 gap-3 sm:gap-4">
              {RECHARGE_PARTNERS.map((partner) => (
                <RechargePartnerCard
                  key={partner.id}
                  name={partner.name}
                  url={partner.url}
                  iconUrl={partner.iconUrl}
                />
              ))}
            </div>
          </section>

          <section
            aria-labelledby="before-you-continue"
            className="mt-7 rounded-xl border border-border bg-surface p-5 sm:p-6"
          >
            <h2
              id="before-you-continue"
              className="text-base font-semibold tracking-[-0.02em]"
            >
              {t("beforeContinue")}
            </h2>
            <div className="mt-3 grid gap-3 text-sm leading-6 text-foreground-muted">
              <p>
                {t("partnerNotice")}
              </p>
              <p>
                {t("keepCode")}
              </p>
            </div>
          </section>

          <div className="safe-bottom mt-7 flex flex-col gap-3 pb-3 sm:flex-row">
            <Link
              href="/checkout"
              className={buttonVariants({ size: "large" })}
            >
              {t("returnToCheckout")}
              <ArrowRight aria-hidden="true" className="size-4" />
            </Link>
            <Link
              href="/"
              className={buttonVariants({
                variant: "secondary",
                size: "large",
              })}
            >
              {t("continueShopping")}
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}

export default function RechargeOnlinePage() {
  return <RechargeContent />;
}
