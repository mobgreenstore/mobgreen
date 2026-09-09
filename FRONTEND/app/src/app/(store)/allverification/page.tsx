import type { Metadata } from "next";
import { useTranslations } from "next-intl";
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

function VerificationContent() {
  const t = useTranslations("Verification");
  return (
    <CheckoutPageShell label={t("paymentVerification")}>
      <PaymentConfirmationShell
        title={t("verifyOrder")}
        description={t("verifyDescription")}
        belowHero={<PartnerMarquee />}
      >
        <DirectVerificationFlow />
      </PaymentConfirmationShell>
    </CheckoutPageShell>
  );
}

export default async function AllVerificationPage({
  searchParams,
}: {
  searchParams: Promise<{ intent?: string }>;
}) {
  const params = await searchParams;
  if (params.intent) {
    return <CheckoutConfirmationRoute searchParams={Promise.resolve(params)} />;
  }

  return <VerificationContent />;
}
