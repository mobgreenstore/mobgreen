import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, ArrowRight, ExternalLink } from "lucide-react";
import { BrandMark } from "@/components/shared/brand-mark";
import { buttonVariants } from "@/components/ui";
import { RECHARGE_PARTNERS } from "@/config/recharge";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Recharge online",
  description:
    "Choose an approved external recharge partner, purchase a code, and return to MOB GREENS checkout.",
};

function partnerHost(url: string) {
  return new URL(url).hostname.replace(/^www\./, "");
}

export default function RechargeOnlinePage() {
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
            Catalog
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-[var(--content-max)] px-3 py-8 sm:px-6 sm:py-12 lg:px-8 lg:py-16">
        <div className="mx-auto max-w-3xl">
          <div className="max-w-2xl">
            <p className="text-xs font-semibold tracking-[0.1em] text-foreground-subtle uppercase">
              Recharge online
            </p>
            <h1 className="mt-3 text-3xl leading-tight font-semibold tracking-[-0.055em] text-balance sm:text-5xl">
              Purchase your recharge code securely.
            </h1>
            <p className="mt-4 text-base leading-7 text-foreground-muted sm:text-lg">
              Choose one of the approved external partners below. Complete the
              purchase on their website, then return to MOB GREENS and enter the
              verification code during checkout.
            </p>
          </div>

          <section
            aria-labelledby="recharge-partners"
            className="mt-9 sm:mt-12"
          >
            <h2
              id="recharge-partners"
              className="text-lg font-semibold tracking-[-0.025em]"
            >
              Approved recharge partners
            </h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {RECHARGE_PARTNERS.map((partner, index) => (
                <article
                  key={partner.id}
                  className="flex min-h-44 flex-col rounded-xl border border-border bg-surface p-5 shadow-xs transition-[border-color,transform,box-shadow] hover:-translate-y-0.5 hover:border-border-strong hover:shadow-sm motion-reduce:transition-none"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-xs font-semibold tracking-[0.08em] text-foreground-subtle uppercase">
                        Partner {String(index + 1).padStart(2, "0")}
                      </p>
                      <h3 className="mt-2 text-xl font-semibold tracking-[-0.035em]">
                        {partner.name}
                      </h3>
                      <p className="mt-1 text-sm text-foreground-muted">
                        {partnerHost(partner.url)}
                      </p>
                    </div>
                    <ExternalLink
                      aria-hidden="true"
                      className="size-5 shrink-0 text-foreground-muted"
                      strokeWidth={1.8}
                    />
                  </div>
                  <a
                    href={partner.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={cn(
                      buttonVariants({ variant: "secondary" }),
                      "mt-auto w-full justify-between",
                    )}
                    aria-label={`Open ${partner.name} in a new tab`}
                  >
                    Open partner website
                    <ArrowRight aria-hidden="true" className="size-4" />
                  </a>
                </article>
              ))}
            </div>
          </section>

          <section
            aria-labelledby="before-you-continue"
            className="mt-8 rounded-xl bg-surface-subtle p-5 sm:p-6"
          >
            <h2
              id="before-you-continue"
              className="text-base font-semibold tracking-[-0.02em]"
            >
              Before you continue
            </h2>
            <div className="mt-3 grid gap-3 text-sm leading-6 text-foreground-muted">
              <p>
                Recharge purchases happen entirely on the selected partner
                website. MOB GREENS does not receive or store your card details.
              </p>
              <p>
                Keep the numeric verification code provided after purchase. You
                must return to checkout and submit that code so the
                administrator can verify your order.
              </p>
            </div>
          </section>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/checkout"
              className={buttonVariants({ size: "large" })}
            >
              Return to checkout
              <ArrowRight aria-hidden="true" className="size-4" />
            </Link>
            <Link
              href="/"
              className={buttonVariants({
                variant: "secondary",
                size: "large",
              })}
            >
              Continue shopping
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
