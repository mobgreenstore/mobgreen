import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, History } from "lucide-react";
import { Card, buttonVariants } from "@/components/ui";
import {
  CheckoutConfirmationRoute,
  confirmationMetadata,
} from "@/features/delivery-matching/components/checkout-confirmation-route";
import { CheckoutPageShell } from "@/features/delivery-matching/components/checkout-page-shell";
import {
  DirectVerificationFlow,
  PartnerMarquee,
} from "@/features/payments/components/direct-verification-flow";
import {
  PaymentConfirmationShell,
  PaymentStatusTimeline,
} from "@/features/payments/components/payment-confirmation";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  ...confirmationMetadata,
  title: "Verification · MOB GREENS",
};

export default async function AllVerificationPage({
  searchParams,
}: {
  searchParams: Promise<{ intent?: string }>;
}) {
  const params = await searchParams;
  if (params.intent) {
    return <CheckoutConfirmationRoute searchParams={Promise.resolve(params)} />;
  }

  return (
    <CheckoutPageShell label="Payment verification">
      <div className="grid gap-6">
        <PaymentConfirmationShell
          title="Verify an order, when you are ready."
          description="Use a secure checkout when one is open, or prepare a payment review from this device. Location and delivery preferences are available here; order completion happens only after a server-verified payment."
          aside={
            <>
              <Card className="p-5">
                <PaymentStatusTimeline state="READY" />
              </Card>
              <Card className="p-5">
                <div className="flex items-start gap-3">
                  <History
                    aria-hidden="true"
                    className="mt-0.5 size-5 shrink-0 text-info"
                  />
                  <div>
                    <p className="font-semibold">Already have an order?</p>
                    <p className="mt-1 text-sm leading-6 text-foreground-muted">
                      Orders remain private to the browser that created them.
                    </p>
                    <Link
                      href="/orders"
                      className={cn(
                        buttonVariants({ variant: "secondary", size: "small" }),
                        "mt-4 w-full",
                      )}
                    >
                      View my orders
                      <ArrowRight aria-hidden="true" className="size-4" />
                    </Link>
                  </div>
                </div>
              </Card>
            </>
          }
        >
          <DirectVerificationFlow />
        </PaymentConfirmationShell>
        <PartnerMarquee />
      </div>
    </CheckoutPageShell>
  );
}
