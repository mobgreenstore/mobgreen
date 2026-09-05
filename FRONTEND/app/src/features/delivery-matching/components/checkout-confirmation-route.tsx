import type { Metadata } from "next";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { notFound, redirect } from "next/navigation";
import { CheckoutPageShell } from "@/features/delivery-matching/components/checkout-page-shell";
import { PaymentConfirmationFlow } from "@/features/payments/components/payment-confirmation-flow";
import { checkoutIntentIdSchema } from "@/features/delivery-matching/schema";
import { CheckoutIntentService } from "@/features/delivery-matching/server/checkout-intent-service";
import { getServerGuestSession } from "@/server/guest-session";

export const confirmationMetadata: Metadata = {
  title: "Confirm your recharge",
  description: "Securely submit recharge codes for your MOB GREENS order.",
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
  const backHref = "/checkout";

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
        <PaymentConfirmationFlow intent={intent} />
      </div>
    </CheckoutPageShell>
  );
}
