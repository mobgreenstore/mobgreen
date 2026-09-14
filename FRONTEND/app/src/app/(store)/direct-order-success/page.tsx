import type { Metadata } from "next";
import Link from "next/link";
import { CircleCheck, Mail, ReceiptText, ShieldCheck } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { BrandLogo } from "@/components/shared/brand-mark";
import { StoreHeader } from "@/components/shared/store-header";
import { Money } from "@/components/commerce/money";
import { Card, InlineAlert, buttonVariants } from "@/components/ui";
import { getRechargePartner } from "@/config/recharge";
import { getGuestDirectOrderSuccess } from "@/features/payments/server/direct-order-success-query";
import { paymentMethodLabel } from "@/features/payments/payment-method";
import { cn } from "@/lib/utils";
import { getServerGuestSession } from "@/server/guest-session";

export const metadata: Metadata = {
  title: "Order received",
  robots: { index: false, follow: false },
};

export default async function DirectOrderSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ reference?: string }>;
}) {
  const reference = (await searchParams).reference?.trim() || "";
  const guest = await getServerGuestSession();
  const order =
    guest && reference
      ? await getGuestDirectOrderSuccess(guest.id, reference)
      : null;
  const t = await getTranslations("DirectOrderSuccess");
  const partner = getRechargePartner(order?.rechargeProvider);

  return (
    <div className="min-h-dvh bg-background">
      <StoreHeader />
      <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6 sm:py-14">
        <Card className="overflow-hidden p-0">
          <div className="border-b border-border bg-surface-subtle px-5 py-7 sm:px-9 sm:py-9">
            <div className="flex items-center justify-between gap-4">
              <BrandLogo
                alt="MOB GREENS"
                className="size-11 rounded-xl object-cover"
                priority
                sizes="48px"
              />
              {order ? (
                <span className="inline-flex min-h-7 items-center rounded-full border border-border bg-background px-2.5 text-xs font-semibold text-foreground-muted">
                  {t("orderReceived")}
                </span>
              ) : null}
            </div>
            <div className="mt-7 flex items-start gap-3">
              <span className="grid size-10 shrink-0 place-items-center rounded-full bg-success-subtle text-success">
                <CircleCheck aria-hidden="true" className="size-5" />
              </span>
              <div>
                <p className="text-xs font-semibold tracking-[0.1em] text-foreground-subtle uppercase">
                  {order ? t("orderReceived") : t("orderStatus")}
                </p>
                <h1 className="mt-1 text-3xl font-semibold tracking-[-0.05em] sm:text-4xl">
                  {order ? t("title") : t("couldNotLoadOrder")}
                </h1>
                {order ? (
                  <p className="mt-3 max-w-xl text-sm leading-6 text-foreground-muted">
                    {t("description")}
                  </p>
                ) : null}
              </div>
            </div>
          </div>

          <div className="grid gap-6 px-5 py-6 sm:px-9 sm:py-8">
            {order ? (
              <>
                <InlineAlert
                  tone="info"
                  title={t("verificationPendingTitle")}
                  description={t("verificationPendingDescription")}
                />

                <div className="grid gap-4 rounded-lg border border-border bg-background p-4 sm:grid-cols-[1fr_auto] sm:items-center sm:p-5">
                  <div>
                    <p className="text-xs font-semibold tracking-[0.1em] text-foreground-subtle uppercase">
                      {t("orderReference")}
                    </p>
                    <p className="mt-2 font-mono text-lg font-semibold">
                      {order.reference}
                    </p>
                  </div>
                  <div className="rounded-md bg-success-subtle px-3 py-2 text-left sm:text-right">
                    <p className="text-xs font-semibold tracking-[0.1em] text-foreground-subtle uppercase">
                      {t("paymentCode")}
                    </p>
                    <p className="mt-2 flex items-center gap-1.5 font-semibold">
                      <CircleCheck
                        aria-hidden="true"
                        className="size-4 text-success"
                      />
                      {t("receivedSecurely")}
                    </p>
                  </div>
                </div>

                <section className="grid gap-4 border-b border-border pb-6 sm:grid-cols-2">
                  <div className="rounded-lg border border-border p-4">
                    <div className="flex items-center gap-2">
                      <Mail
                        aria-hidden="true"
                        className="size-4 text-foreground-muted"
                      />
                      <p className="text-xs font-semibold tracking-[0.1em] text-foreground-subtle uppercase">
                        {t("customerDetails")}
                      </p>
                    </div>
                    <dl className="mt-4 grid gap-3 text-sm">
                      <div className="grid gap-1">
                        <dt className="text-xs font-semibold text-foreground-subtle">
                          {t("name")}
                        </dt>
                        <dd className="font-medium">{order.customerName}</dd>
                      </div>
                      <div className="grid gap-1">
                        <dt className="text-xs font-semibold text-foreground-subtle">
                          {t("email")}
                        </dt>
                        <dd className="break-all text-foreground-muted">
                          {order.customerEmail}
                        </dd>
                      </div>
                    </dl>
                  </div>
                  <div className="rounded-lg border border-border p-4">
                    <div className="flex items-center gap-2">
                      <ReceiptText
                        aria-hidden="true"
                        className="size-4 text-foreground-muted"
                      />
                      <p className="text-xs font-semibold tracking-[0.1em] text-foreground-subtle uppercase">
                        {t("orderDetails")}
                      </p>
                    </div>
                    <dl className="mt-4 grid gap-3 text-sm">
                      <div className="grid gap-1">
                        <dt className="text-xs font-semibold text-foreground-subtle">
                          {t("amount")}
                        </dt>
                        <dd className="font-semibold">
                          <Money
                            amountMinor={Number(order.totalMinor)}
                            currency={order.currency}
                          />
                        </dd>
                      </div>
                      <div className="grid gap-1">
                        <dt className="text-xs font-semibold text-foreground-subtle">
                          {t("paymentMethod")}
                        </dt>
                        <dd className="text-foreground-muted">
                          {paymentMethodLabel(
                            order.paymentMethod,
                            partner?.name ?? order.rechargeProvider,
                          )}
                        </dd>
                      </div>
                      {partner ? (
                        <div className="grid gap-1">
                          <dt className="text-xs font-semibold text-foreground-subtle">
                            {t("rechargePartner")}
                          </dt>
                          <dd className="text-foreground-muted">
                            {partner.name}
                          </dd>
                        </div>
                      ) : null}
                    </dl>
                  </div>
                </section>

                <div className="flex items-start gap-3 rounded-lg bg-surface-subtle p-4">
                  <ShieldCheck
                    aria-hidden="true"
                    className="mt-0.5 size-5 shrink-0 text-success"
                  />
                  <p className="text-sm leading-6 text-foreground-muted">
                    {t("verificationPendingDescription")}
                  </p>
                </div>

                <Link
                  href="/"
                  className={cn(buttonVariants({ size: "large" }), "w-full")}
                >
                  {t("continueShopping")}
                </Link>
              </>
            ) : (
              <>
                <InlineAlert
                  tone="info"
                  title={t("openOrdersPrivate")}
                  description={t("privateOrdersDescription")}
                />
                {reference ? (
                  <p className="text-sm text-foreground-muted">
                    {t("referenceHint")}{" "}
                    <span className="font-mono font-semibold text-foreground">
                      {reference}
                    </span>
                  </p>
                ) : null}
                <Link
                  href="/"
                  className={cn(buttonVariants({ size: "large" }), "w-full")}
                >
                  {t("shopStore")}
                </Link>
              </>
            )}
          </div>
        </Card>
      </main>
    </div>
  );
}
