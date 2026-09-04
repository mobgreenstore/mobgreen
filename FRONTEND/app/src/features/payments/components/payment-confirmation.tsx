"use client";

import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { Check, Clock3 } from "lucide-react";
import { Money } from "@/components/commerce";
import { Card, InlineAlert } from "@/components/ui";
import type { SupportedCurrency } from "@/config/commerce";
import { PaymentMethodGlyph } from "@/features/payments/components/payment-method-glyph";
import type { PaymentMethodId } from "@/features/payments/payment-method";
import { paymentMethodLabel } from "@/features/payments/payment-method";
import { cn } from "@/lib/utils";

export function PaymentConfirmationShell({
  title,
  description,
  children,
  aside,
  belowHero,
}: {
  title: string;
  description: string;
  children: ReactNode;
  aside?: ReactNode;
  belowHero?: ReactNode;
}) {
  return (
    <section className="overflow-hidden rounded-[1.75rem] border border-border/70 bg-surface shadow-[0_24px_80px_rgb(0_0_0/0.09)]">
      <header className="relative isolate overflow-hidden bg-inverse px-5 py-8 text-inverse-foreground sm:px-8 sm:py-10">
        <div
          aria-hidden="true"
          className="absolute inset-0 -z-20 bg-[url('/images/verification/payment-hero-v1.png')] bg-cover bg-[position:72%_center] opacity-100"
        />
        <div
          aria-hidden="true"
          className="absolute inset-0 -z-10 bg-[linear-gradient(90deg,rgb(2_6_12/.7)_0%,rgb(3_13_24/.54)_45%,rgb(2_12_21/.08)_100%)]"
        />
        <div className="max-w-2xl">
          <p className="text-xs font-bold tracking-[0.14em] text-white/80 uppercase">
            Secure confirmation
          </p>
          <h1 className="mt-5 text-4xl leading-[0.96] font-black tracking-[-0.055em] text-balance sm:text-5xl">
            {title}
          </h1>
          <p className="mt-4 max-w-xl text-sm leading-6 text-white/85 sm:text-base">
            {description}
          </p>
        </div>
      </header>
      {belowHero}
      <div
        className={cn(
          "p-5 sm:p-7 lg:p-8",
          aside &&
            "grid gap-7 lg:grid-cols-[minmax(0,1fr)_21rem] lg:items-start",
        )}
      >
        <div className="min-w-0">{children}</div>
        {aside ? (
          <aside className="grid gap-4 lg:sticky lg:top-24">{aside}</aside>
        ) : null}
      </div>
    </section>
  );
}

const methods: Array<{
  id: PaymentMethodId;
  shortLabel: string;
}> = [
  { id: "RECHARGE_FROM_STORE", shortLabel: "From store" },
  { id: "RECHARGE_ONLINE", shortLabel: "Online" },
  { id: "BITCOIN_DEPOSIT", shortLabel: "Bitcoin" },
];

export function PaymentMethodSummary({
  method,
  rechargeProvider,
}: {
  method: PaymentMethodId;
  rechargeProvider: string | null;
}) {
  return (
    <Card className="p-2">
      <div
        role="group"
        aria-label="Payment method fixed for this checkout"
        className="grid grid-cols-3 gap-1"
      >
        {methods.map((option) => {
          const active = option.id === method;
          return (
            <div
              key={option.id}
              aria-current={active ? "true" : undefined}
              className={cn(
                "flex min-h-14 items-center justify-center gap-1.5 rounded-xl px-2 text-center text-xs font-bold",
                active
                  ? "bg-foreground text-background shadow-sm"
                  : "text-foreground-subtle opacity-55",
              )}
            >
              <PaymentMethodGlyph
                method={option.id}
                className="size-4 shrink-0"
              />
              {option.shortLabel}
            </div>
          );
        })}
      </div>
      <p className="px-2 pt-3 pb-2 text-xs leading-5 text-foreground-muted">
        Selected:{" "}
        <strong className="text-foreground">
          {paymentMethodLabel(method, rechargeProvider)}
        </strong>
        . To choose another method, return to checkout and begin a new verification.
      </p>
    </Card>
  );
}

export function OrderAmountSummary({
  currency,
  totalMinor,
  depositMinor = totalMinor,
  cashBalanceMinor = 0,
}: {
  currency: SupportedCurrency;
  totalMinor: number;
  depositMinor?: number;
  cashBalanceMinor?: number;
}) {
  return (
    <Card className="overflow-hidden p-0">
      <div className="bg-surface-subtle px-5 py-4">
        <p className="text-xs font-semibold tracking-[0.08em] text-foreground-subtle uppercase">
          Confirmed order total
        </p>
        <p className="mt-1 text-3xl font-black tracking-[-0.04em]">
          <Money amountMinor={totalMinor} currency={currency} />
        </p>
      </div>
      <dl className="grid grid-cols-2 divide-x divide-border border-t border-border">
        <div className="p-4">
          <dt className="text-xs text-foreground-muted">Due now</dt>
          <dd className="mt-1 font-bold">
            <Money amountMinor={depositMinor} currency={currency} />
          </dd>
        </div>
        <div className="p-4">
          <dt className="text-xs text-foreground-muted">Cash on delivery</dt>
          <dd className="mt-1 font-bold">
            <Money amountMinor={cashBalanceMinor} currency={currency} />
          </dd>
        </div>
      </dl>
    </Card>
  );
}

export type PaymentTimelineState =
  "READY" | "SUBMITTED" | "DETECTED" | "CONFIRMING" | "CONFIRMED" | "FAILED";

export function PaymentStatusTimeline({
  state,
}: {
  state: PaymentTimelineState;
}) {
  const labels = ["Details secured", "Payment submitted", "Store confirmed"];
  const active =
    state === "READY"
      ? 0
      : state === "SUBMITTED" || state === "DETECTED" || state === "CONFIRMING"
        ? 1
        : 2;
  return (
    <ol aria-label="Payment progress" className="grid grid-cols-3 gap-2">
      {labels.map((label, index) => (
        <li key={label} aria-current={index === active ? "step" : undefined}>
          <div
            className={cn(
              "h-1.5 rounded-full",
              index <= active
                ? state === "FAILED"
                  ? "bg-danger"
                  : "bg-info"
                : "bg-border",
            )}
          />
          <div className="mt-2 flex items-start gap-1.5">
            <span
              className={cn(
                "grid size-5 shrink-0 place-items-center rounded-full",
                index <= active
                  ? "bg-info-subtle text-info"
                  : "bg-surface-subtle text-foreground-subtle",
              )}
            >
              {index < active ? (
                <Check aria-hidden="true" className="size-3" />
              ) : (
                <Clock3 aria-hidden="true" className="size-3" />
              )}
            </span>
            <span className="text-[0.6875rem] leading-4 font-semibold sm:text-xs">
              {label}
            </span>
          </div>
        </li>
      ))}
    </ol>
  );
}

type BitcoinAttempt = {
  publicId: string;
  providerInvoiceId: string | null;
  paymentAddress: string | null;
  paymentUri: string | null;
  bitcoinAmount: string | null;
  depositMinor: number;
  cashBalanceMinor: number;
  status: string;
  expiresAt: string | null;
};

export function BitcoinInvoicePanel({
  intentId,
  currency,
  depositMinor,
  cashBalanceMinor,
}: {
  intentId: string;
  currency: SupportedCurrency;
  depositMinor: number;
  cashBalanceMinor: number;
}) {
  const [attempt, setAttempt] = useState<BitcoinAttempt | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  useEffect(() => {
    let cancelled = false;
    const endpoint = `/api/checkout/intents/${encodeURIComponent(intentId)}/bitcoin`;
    (async () => {
      try {
        const existing = await fetch(endpoint, { cache: "no-store" });
        if (!existing.ok) throw new Error("Bitcoin checkout is unavailable.");
        const loaded = (await existing.json()) as {
          attempt: BitcoinAttempt | null;
        };
        if (loaded.attempt) {
          if (!cancelled) setAttempt(loaded.attempt);
          return;
        }
        const created = await fetch(endpoint, {
          method: "POST",
          cache: "no-store",
        });
        const body = (await created.json()) as {
          attempt?: BitcoinAttempt;
          error?: string;
        };
        if (!created.ok || !body.attempt)
          throw new Error(
            body.error ?? "Unable to create the Bitcoin invoice.",
          );
        if (!cancelled) setAttempt(body.attempt);
      } catch (reason) {
        if (!cancelled)
          setError(
            reason instanceof Error
              ? reason.message
              : "Bitcoin checkout is unavailable.",
          );
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [intentId]);
  useEffect(() => {
    if (
      !attempt ||
      ["SETTLED", "EXPIRED", "INVALID", "FAILED"].includes(attempt.status)
    )
      return;
    const timer = window.setInterval(async () => {
      const response = await fetch(
        `/api/checkout/intents/${encodeURIComponent(intentId)}/bitcoin`,
        { cache: "no-store" },
      );
      if (!response.ok) return;
      const body = (await response.json()) as {
        attempt: BitcoinAttempt | null;
      };
      if (body.attempt) setAttempt(body.attempt);
    }, 5000);
    return () => window.clearInterval(timer);
  }, [attempt, intentId]);
  async function copyAddress() {
    if (!attempt?.paymentAddress) return;
    await navigator.clipboard.writeText(attempt.paymentAddress);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  }
  if (loading)
    return (
      <InlineAlert
        tone="info"
        title="Preparing your Bitcoin invoice"
        description="Creating a unique payment request securely. This can take a few seconds."
      />
    );
  if (error)
    return (
      <InlineAlert
        tone="danger"
        title="Bitcoin invoice unavailable"
        description={error}
      />
    );
  if (!attempt)
    return (
      <InlineAlert
        tone="danger"
        title="Bitcoin invoice unavailable"
        description="No payment request could be created. Please start a new checkout."
      />
    );
  const statusLabel =
    attempt.status === "SETTLED"
      ? "Payment confirmed"
      : attempt.status === "CONFIRMING"
        ? "Confirming on the network"
        : attempt.status === "PAYMENT_DETECTED"
          ? "Payment detected"
          : attempt.status === "EXPIRED"
            ? "Invoice expired"
            : "Waiting for payment";
  return (
    <Card className="grid gap-5 overflow-hidden p-5 sm:p-6">
      <div>
        <p className="text-xs font-bold tracking-[0.12em] text-foreground-subtle uppercase">
          Bitcoin deposit
        </p>
        <h2 className="mt-2 text-2xl font-black tracking-tight">
          {statusLabel}
        </h2>
        <p className="mt-2 text-sm leading-5 text-foreground-muted">
          Pay 50% now, rest cash. Your invoice is monitored by the payment
          provider; this page never trusts a browser success message.
        </p>
      </div>
      <div className="grid gap-3 rounded-2xl bg-surface-subtle p-4 sm:grid-cols-2">
        <div>
          <p className="text-xs text-foreground-muted">Send exactly</p>
          <p className="mt-1 text-xl font-black">
            {attempt.bitcoinAmount ?? "-"} BTC
          </p>
          <p className="mt-1 text-xs text-foreground-muted">
            <Money amountMinor={depositMinor} currency={currency} /> deposit
          </p>
        </div>
        <div>
          <p className="text-xs text-foreground-muted">Cash on delivery</p>
          <p className="mt-1 text-xl font-black">
            <Money amountMinor={cashBalanceMinor} currency={currency} />
          </p>
        </div>
      </div>
      {attempt.paymentAddress && (
        <div className="grid gap-2">
          <p className="text-xs font-semibold">Bitcoin address</p>
          <code className="rounded-xl border border-border bg-background p-3 text-xs leading-5 break-all">
            {attempt.paymentAddress}
          </code>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={copyAddress}
              className="rounded-xl border border-border px-3 py-2 text-sm font-semibold"
            >
              {copied ? "Copied" : "Copy address"}
            </button>
            {attempt.paymentUri && (
              <a
                href={attempt.paymentUri}
                className="rounded-xl bg-foreground px-3 py-2 text-sm font-semibold text-background"
              >
                Open Bitcoin wallet
              </a>
            )}
          </div>
        </div>
      )}
      <InlineAlert
        tone={
          attempt.status === "SETTLED"
            ? "success"
            : attempt.status === "EXPIRED" || attempt.status === "INVALID"
              ? "danger"
              : "info"
        }
        title={
          attempt.status === "SETTLED"
            ? "Deposit settled"
            : "Keep this page open"
        }
        description={
          attempt.status === "SETTLED"
            ? "The server confirmed settlement. Delivery matching can continue."
            : "After authorizing payment in your wallet, return here while confirmation completes."
        }
      />
    </Card>
  );
}
