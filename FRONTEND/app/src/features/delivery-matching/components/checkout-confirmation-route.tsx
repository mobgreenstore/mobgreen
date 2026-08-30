import type { Metadata } from "next";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { notFound, redirect } from "next/navigation";
import { CheckoutConfirmationForm } from "@/features/delivery-matching/components/checkout-confirmation-form";
import { CheckoutPageShell } from "@/features/delivery-matching/components/checkout-page-shell";
import { CheckoutProgress } from "@/features/delivery-matching/components/checkout-progress";
import { VerificationHero } from "@/features/delivery-matching/components/verification-hero";
import { checkoutIntentIdSchema } from "@/features/delivery-matching/schema";
import { CheckoutIntentService } from "@/features/delivery-matching/server/checkout-intent-service";
import { getServerGuestSession } from "@/server/guest-session";

export const confirmationMetadata: Metadata = {
  title: "Confirm your recharge",
  description: "Securely submit a recharge code for MOB GREENS order review.",
  robots: { index: false, follow: false },
};

export async function CheckoutConfirmationRoute({
  searchParams,
}: {
  searchParams: Promise<{ intent?: string }>;
}) {
  const parsed = checkoutIntentIdSchema.safeParse((await searchParams).intent);
  if (!parsed.success) notFound();
  const guest = await getServerGuestSession();
  if (!guest) notFound();
  const intent = await new CheckoutIntentService().getConfirmationForGuest(
    guest.id,
    parsed.data,
  );
  if (!intent) notFound();
  if (intent.status === "SUBMITTED") redirect("/orders?tab=pending");
  if (intent.fulfillmentType === "DELIVERY" && !intent.selectedCourier) {
    redirect(
      `/checkout/delivery?intent=${encodeURIComponent(intent.publicId)}`,
    );
  }

  const backHref =
    intent.fulfillmentType === "DELIVERY"
      ? `/checkout/delivery?intent=${encodeURIComponent(intent.publicId)}`
      : "/checkout";

  return (
    <CheckoutPageShell label="Recharge confirmation">
      <Link
        href={backHref}
        className="inline-flex min-h-11 items-center gap-1.5 text-sm font-semibold text-foreground-muted hover:text-foreground"
      >
        <ChevronLeft aria-hidden="true" className="size-4" />
        Back
      </Link>
      <div className="mt-3">
        <VerificationHero intent={intent} />
      </div>
      <div className="mx-auto mt-5 max-w-3xl rounded-lg border border-border bg-surface p-4 shadow-xs sm:p-5">
        <CheckoutProgress />
      </div>
      <div className="mt-7 sm:mt-10">
        <CheckoutConfirmationForm intent={intent} />
      </div>
    </CheckoutPageShell>
  );
}
