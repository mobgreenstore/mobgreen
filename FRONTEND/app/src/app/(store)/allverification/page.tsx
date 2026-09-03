import type { Metadata } from "next";
import {
  CheckoutConfirmationRoute,
  confirmationMetadata,
} from "@/features/delivery-matching/components/checkout-confirmation-route";
import { CheckoutPageShell } from "@/features/delivery-matching/components/checkout-page-shell";
import {
  DirectVerificationFlow,
  PartnerMarquee,
} from "@/features/payments/components/direct-verification-flow";
import { PaymentConfirmationShell } from "@/features/payments/components/payment-confirmation";

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
      <PaymentConfirmationShell
        title="Verify an order, when you are ready."
        description="Enter your payment details, confirm the delivery location, then choose a nearby delivery profile."
        belowHero={<PartnerMarquee />}
      >
        <DirectVerificationFlow />
      </PaymentConfirmationShell>
    </CheckoutPageShell>
  );
}
