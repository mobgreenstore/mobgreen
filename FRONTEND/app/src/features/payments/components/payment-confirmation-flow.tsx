"use client";

import Link from "next/link";
import { ArrowLeft, MailCheck, ShieldCheck } from "lucide-react";
import { useRouter } from "next/navigation";
import { InlineAlert, buttonVariants } from "@/components/ui";
import { useCart } from "@/features/cart/cart-provider";
import { DeliveryMatchingFlow } from "@/features/delivery-matching/components/delivery-matching-flow";
import { VerificationOrderSummary } from "@/features/delivery-matching/components/verification-order-summary";
import type { CheckoutConfirmationView } from "@/features/delivery-matching/types";
import {
  BitcoinInvoicePanel,
  OrderAmountSummary,
  PaymentConfirmationShell,
  PaymentMethodSummary,
} from "@/features/payments/components/payment-confirmation";
import { RechargeCodeConfirmation } from "@/features/payments/components/recharge-code-confirmation";
import {
  RechargePartnerDirectory,
  RechargePartnerRail,
} from "@/features/payments/components/recharge-partner-rail";
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
  const needsDeliverySelection =
    intent.fulfillmentType === "DELIVERY" && !intent.selectedCourier;
  const split = bitcoin
    ? calculateBitcoinDeposit(intent.subtotalMinor)
    : { depositMinor: intent.subtotalMinor, remainingCashMinor: 0 };

  function completed(reference: string) {
    clear();
    router.push("/order-success?reference=" + encodeURIComponent(reference));
  }

  const aside = (
    <>
      <OrderAmountSummary
        currency={intent.currency}
        totalMinor={intent.subtotalMinor}
        depositMinor={split.depositMinor}
        cashBalanceMinor={split.remainingCashMinor}
      />
      <VerificationOrderSummary intent={intent} />
      <Link
        href="/checkout"
        className={cn(buttonVariants({ variant: "secondary" }), "w-full")}
      >
        <ArrowLeft aria-hidden="true" className="size-4" />
        Back to checkout
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
          : "Add one or several recharge codes. They are encrypted immediately and protected with your confirmed order details."
      }
      belowHero={<RechargePartnerRail />}
      aside={aside}
    >
      <div className="grid gap-7">
        <PaymentMethodSummary
          method={intent.paymentMethod}
          rechargeProvider={intent.rechargeProvider}
        />

        {intent.paymentMethod === "RECHARGE_ONLINE" ? (
          <RechargePartnerDirectory
            selectedPartnerId={intent.rechargeProvider}
          />
        ) : null}

        {!intent.confirmationEligible && (
          <InlineAlert
            tone="danger"
            title="Your card changed"
            description="Return to the card and confirm the latest products, offers, and prices before submitting payment."
          />
        )}

        <section className="flex items-start gap-3 border-b border-border pb-6">
          <MailCheck
            aria-hidden="true"
            className="mt-0.5 size-5 shrink-0 text-info"
          />
          <div>
            <p className="font-semibold">Confirmation contact</p>
            <p className="mt-1 text-sm leading-5 text-foreground-muted">
              This verified order is already linked to{" "}
              <strong className="text-foreground">
                {intent.customer.email}
              </strong>
              .
            </p>
          </div>
        </section>

        {needsDeliverySelection ? (
          <section className="grid gap-5">
            <div>
              <p className="text-xs font-bold tracking-[0.12em] text-info uppercase">
                Delivery setup
              </p>
              <h2 className="mt-1 text-2xl font-black tracking-[-0.04em]">
                Choose your nearby delivery profile
              </h2>
              <p className="mt-2 text-sm leading-6 text-foreground-muted">
                Your checkout details are secure. Select one of the available
                nearby profiles before you submit payment.
              </p>
            </div>
            <DeliveryMatchingFlow initialIntent={intent} />
          </section>
        ) : bitcoin ? (
          <BitcoinInvoicePanel
            intentId={intent.publicId}
            currency={intent.currency}
            depositMinor={split.depositMinor}
            cashBalanceMinor={split.remainingCashMinor}
            onCompleted={completed}
          />
        ) : (
          <RechargeCodeConfirmation
            intentId={intent.publicId}
            eligible={intent.confirmationEligible}
            onCompleted={completed}
          />
        )}

        {!needsDeliverySelection && (
          <div className="flex gap-3 border-t border-border pt-5 text-xs leading-5 text-foreground-muted">
            <ShieldCheck
              aria-hidden="true"
              className="mt-0.5 size-4 shrink-0 text-info"
            />
            Submitting recharge codes creates your order immediately. Bitcoin
            can progress only after server-confirmed settlement.
          </div>
        )}
      </div>
    </PaymentConfirmationShell>
  );
}
