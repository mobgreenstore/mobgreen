"use client";

import Link from "next/link";
import { ArrowLeft, MailCheck, ShieldCheck } from "lucide-react";
import { useRouter } from "next/navigation";
import { Card, InlineAlert, buttonVariants } from "@/components/ui";
import { useCart } from "@/features/cart/cart-provider";
import { VerificationOrderSummary } from "@/features/delivery-matching/components/verification-order-summary";
import type { CheckoutConfirmationView } from "@/features/delivery-matching/types";
import {
  BitcoinInvoicePanel,
  OrderAmountSummary,
  PaymentConfirmationShell,
  PaymentMethodSummary,
  PaymentStatusTimeline,
} from "@/features/payments/components/payment-confirmation";
import { RechargeCodeConfirmation } from "@/features/payments/components/recharge-code-confirmation";
import { calculateBitcoinDeposit } from "@/features/bitcoin/policy";
import { cn } from "@/lib/utils";

export function PaymentConfirmationFlow({
  intent,
}: {
  intent: CheckoutConfirmationView;
}) {
  const router = useRouter();
  const { clear } = useCart();
  const bitcoin = intent.paymentMethod === "BITCOIN_DEPOSIT";
  const split = bitcoin
    ? calculateBitcoinDeposit(intent.subtotalMinor)
    : { depositMinor: intent.subtotalMinor, remainingCashMinor: 0 };

  function completed(reference: string) {
    clear();
    router.push(`/order-success?reference=${encodeURIComponent(reference)}`);
  }

  const aside = (
    <>
      <OrderAmountSummary
        currency={intent.currency}
        totalMinor={intent.subtotalMinor}
        depositMinor={split.depositMinor}
        cashBalanceMinor={split.remainingCashMinor}
      />
      <Card className="p-5">
        <PaymentStatusTimeline state="READY" />
      </Card>
      <VerificationOrderSummary intent={intent} />
      <Link
        href="/checkout"
        className={cn(buttonVariants({ variant: "secondary" }), "w-full")}
      >
        <ArrowLeft aria-hidden="true" className="size-4" />
        Cancel and choose another method
      </Link>
    </>
  );

  return (
    <PaymentConfirmationShell
      title={
        bitcoin
          ? "Pay half. Keep every step visible."
          : "One secure step, clearly confirmed."
      }
      description={
        bitcoin
          ? "Your order amount is locked. Payment progression comes only from the invoice provider and blockchain—not from this browser."
          : "Add one or several recharge codes. They are encrypted immediately, masked in email, and reviewed before the order is marked paid."
      }
      aside={aside}
    >
      <div className="grid gap-5">
        <PaymentMethodSummary
          method={intent.paymentMethod}
          rechargeProvider={intent.rechargeProvider}
        />

        {!intent.confirmationEligible && (
          <InlineAlert
            tone="danger"
            title="Your cart changed"
            description="Return to the cart and confirm the latest products, offers, and prices before submitting payment."
          />
        )}

        <Card className="flex items-start gap-3 p-4 sm:p-5">
          <div className="grid size-10 shrink-0 place-items-center rounded-full bg-info-subtle text-info">
            <MailCheck aria-hidden="true" className="size-5" />
          </div>
          <div>
            <p className="font-semibold">Confirmation contact</p>
            <p className="mt-1 text-sm leading-5 text-foreground-muted">
              Updates for this attempt are associated with{" "}
              <strong className="text-foreground">
                {intent.customer.email}
              </strong>
              .
            </p>
          </div>
        </Card>

        {bitcoin ? (
          <BitcoinInvoicePanel
            intentId={intent.publicId}
            currency={intent.currency}
            depositMinor={split.depositMinor}
            cashBalanceMinor={split.remainingCashMinor}
          />
        ) : (
          <RechargeCodeConfirmation
            intentId={intent.publicId}
            customerEmail={intent.customer.email}
            eligible={intent.confirmationEligible}
            onCompleted={completed}
          />
        )}

        <div className="flex gap-3 rounded-2xl border border-border/70 bg-surface-subtle p-4 text-xs leading-5 text-foreground-muted">
          <ShieldCheck
            aria-hidden="true"
            className="mt-0.5 size-4 shrink-0 text-info"
          />
          Submitting a recharge code creates a pending-review payment. It never
          marks the order completed. Bitcoin can progress only after
          server-confirmed settlement.
        </div>
      </div>
    </PaymentConfirmationShell>
  );
}
