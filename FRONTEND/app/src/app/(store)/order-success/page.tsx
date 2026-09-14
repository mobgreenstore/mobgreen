import type { Metadata } from "next";
import Link from "next/link";
import { CircleCheck, MapPin, Navigation, User, CreditCard, Wallet } from "lucide-react";
import { useTranslations } from "next-intl";
import { BrandLogo } from "@/components/shared/brand-mark";
import { StoreHeader } from "@/components/shared/store-header";
import { Card, InlineAlert, buttonVariants } from "@/components/ui";
import { getGuestOrder } from "@/features/customer-orders/server/queries";
import { getRechargePartner } from "@/config/recharge";
import { cn } from "@/lib/utils";
import { getServerGuestSession } from "@/server/guest-session";

export const metadata: Metadata = {
  title: "Order received",
  robots: { index: false, follow: false },
};

function distanceLabel(distanceMeters: number, t: (key: string, params?: any) => string) {
  const distance = distanceMeters < 1_000
    ? distanceMeters
    : (distanceMeters / 1_000).toFixed(1);
  const key = distanceMeters < 1_000 ? "mAway" : "kmAway";
  return t(key, { distance });
}

function durationLabel(durationSeconds: number, t: (key: string, params?: any) => string) {
  const minutes = Math.max(1, Math.ceil(durationSeconds / 60));
  return t("aboutMin", { minutes });
}

function OrderSuccessContent({ order, reference, isDirect }: { order: any; reference: string; isDirect: boolean }) {
  const t = useTranslations("OrderSuccess");
  return (
    <div className="min-h-dvh bg-background">
      <StoreHeader />
      <main className="mx-auto max-w-2xl px-4 py-10 sm:px-6 sm:py-16">
        <Card className="overflow-hidden p-0">
          <div className="border-b border-border bg-surface-subtle px-6 py-7 sm:px-9 sm:py-9">
            <div className="flex items-center justify-between gap-4">
              <BrandLogo
                alt="MOB GREENS"
                className="size-12 rounded-xl object-cover"
                priority
                sizes="48px"
              />
              {order ? (
                <span className="inline-flex min-h-7 items-center rounded-full border border-border bg-background px-2.5 text-xs font-semibold text-foreground-muted">
                  {isDirect ? t("verificationCompleted") : t("orderReceived")}
                </span>
              ) : null}
            </div>
            <div className="mt-7 flex items-start gap-3">
              <span className="grid size-10 shrink-0 place-items-center rounded-full bg-success-subtle text-success">
                <CircleCheck aria-hidden="true" className="size-5" />
              </span>
              <div>
                <p className="text-xs font-semibold tracking-[0.1em] text-foreground-subtle uppercase">
                  {order ? (isDirect ? t("verificationCompleted") : t("orderReceived")) : t("orderStatus")}
                </p>
                <h1 className="mt-1 text-3xl font-semibold tracking-[-0.05em] sm:text-4xl">
                  {order
                    ? (isDirect ? t("codeVerifiedSuccessfully") : t("yourOrderReceived"))
                    : t("couldNotLoadOrder")}
                </h1>
              </div>
            </div>
          </div>

          <div className="grid gap-6 px-6 py-7 sm:px-9 sm:py-9">
            {order ? (
              <>
                <p className="max-w-xl text-sm leading-6 text-foreground-muted">
                  {isDirect ? t("verificationComplete") : t("orderSubmitted")}
                </p>

                <div className="flex flex-wrap items-end justify-between gap-4 border-y border-border py-5">
                  <div>
                    <p className="text-xs font-semibold tracking-[0.1em] text-foreground-subtle uppercase">
                      {isDirect ? t("completedVerification") : t("orderReference")}
                    </p>
                    <p className="mt-2 font-mono text-lg font-semibold">
                      {order.reference}
                    </p>
                  </div>
                  <div className="text-left sm:text-right">
                    <p className="text-xs font-semibold tracking-[0.1em] text-foreground-subtle uppercase">
                      {t("paymentCode")}
                    </p>
                    <p className="mt-2 flex items-center gap-1.5 font-semibold">
                      <CircleCheck
                        aria-hidden="true"
                        className="size-4 text-success"
                      />
                      {isDirect ? t("verifiedSecurely") : t("receivedSecurely")}
                    </p>
                  </div>
                </div>

                {isDirect && (
                  <section className="grid gap-6 border-b border-border pb-6">
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="flex items-start gap-3 rounded-xl bg-surface-subtle p-4">
                        <div className="grid size-10 shrink-0 place-items-center rounded-full bg-primary/10 text-primary">
                          <User aria-hidden="true" className="size-5" />
                        </div>
                        <div className="flex-1">
                          <p className="text-xs font-semibold tracking-[0.1em] text-foreground-subtle uppercase">
                            {t("customer")}
                          </p>
                          <p className="mt-1 text-sm font-semibold text-foreground">
                            {order.customerName}
                          </p>
                          <p className="mt-0.5 text-sm text-foreground-muted">
                            {order.customerEmail}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3 rounded-xl bg-surface-subtle p-4">
                        <div className="grid size-10 shrink-0 place-items-center rounded-full bg-success/10 text-success">
                          <CreditCard aria-hidden="true" className="size-5" />
                        </div>
                        <div className="flex-1">
                          <p className="text-xs font-semibold tracking-[0.1em] text-foreground-subtle uppercase">
                            {t("amount")}
                          </p>
                          <p className="mt-1 text-lg font-bold text-foreground">
                            {(Number(order.totalMinor) / 100).toFixed(2)} {order.currency}
                          </p>
                          <p className="mt-0.5 text-sm text-foreground-muted">
                            {order.paymentMethod}
                          </p>
                        </div>
                      </div>
                    </div>
                    {order.rechargeProvider && (() => {
                      const partner = getRechargePartner(order.rechargeProvider);
                      return (
                        <div className="flex items-center gap-3 rounded-xl bg-surface-subtle p-4">
                          <div className="grid size-10 shrink-0 place-items-center rounded-full bg-info/10 text-info">
                            <Wallet aria-hidden="true" className="size-5" />
                          </div>
                          <div className="flex-1">
                            <p className="text-xs font-semibold tracking-[0.1em] text-foreground-subtle uppercase">
                              {t("rechargePartner")}
                            </p>
                            <div className="mt-1 flex items-center gap-2">
                              {partner?.iconUrl && (
                                <img
                                  src={partner.iconUrl}
                                  alt={partner.name}
                                  className="size-6 rounded object-contain"
                                />
                              )}
                              <p className="text-sm font-semibold text-foreground">
                                {partner?.name || order.rechargeProvider}
                              </p>
                            </div>
                          </div>
                        </div>
                      );
                    })()}
                  </section>
                )}

                {order.fulfillmentType === "DELIVERY" && !isDirect && (
                  <section className="grid gap-3 border-b border-border pb-6">
                    <div className="flex items-start gap-3">
                      <MapPin
                        aria-hidden="true"
                        className="mt-0.5 size-5 shrink-0 text-info"
                      />
                      <div>
                        <h2 className="font-semibold">{t("deliveryAndTracking")}</h2>
                        <p className="mt-1 text-sm leading-6 text-foreground-muted">
                          {order.deliveryLocation?.formattedAddress ??
                            t("confirmedLocation")}
                        </p>
                      </div>
                    </div>
                    {order.courier && (
                      <p className="ml-8 text-sm text-foreground-muted">
                        {order.courier.displayName} {t("selectedProfile")} ·{" "}
                        {distanceLabel(order.courier.distanceMeters, t)} ·{" "}
                        {durationLabel(order.courier.estimatedDurationSeconds, t)}.
                      </p>
                    )}
                  </section>
                )}

                <div className="grid grid-cols-2 gap-3">
                  {!isDirect && (
                    <Link
                      href={`/orders/${encodeURIComponent(order.reference)}`}
                      className={cn(buttonVariants({ size: "large" }), "w-full")}
                    >
                      {t("viewOrder")}
                    </Link>
                  )}
                  {order.fulfillmentType === "DELIVERY" && !isDirect ? (
                    <Link
                      href={`/orders/${encodeURIComponent(order.reference)}/tracking`}
                      className={cn(
                        buttonVariants({ variant: "secondary", size: "large" }),
                        "w-full",
                      )}
                    >
                      <Navigation aria-hidden="true" className="size-4" />
                      {t("viewTracking")}
                    </Link>
                  ) : (
                    <Link
                      href="/"
                      className={cn(
                        buttonVariants({ variant: isDirect ? "primary" : "secondary", size: "large" }),
                        "w-full",
                      )}
                    >
                      {t("continueShopping")}
                    </Link>
                  )}
                </div>
              </>
            ) : (
              <>
                <InlineAlert
                  tone="info"
                  title={t("openOrdersPrivate")}
                  description={t("privateOrdersDescription")}
                />
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

export default async function OrderSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ reference?: string; direct?: string }>;
}) {
  const params = await searchParams;
  const reference = params.reference?.trim() || "";
  const isDirect = params.direct === "true";
  const guest = await getServerGuestSession();
  const order =
    guest && reference ? await getGuestOrder(guest.id, reference) : null;

  return <OrderSuccessContent order={order} reference={reference} isDirect={isDirect} />;
}
