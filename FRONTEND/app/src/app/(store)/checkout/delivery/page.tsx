import type { Metadata } from "next";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { notFound, redirect } from "next/navigation";
import { useTranslations } from "next-intl";
import { StoreHeader } from "@/components/shared/store-header";
import { DeliveryMatchingFlow } from "@/features/delivery-matching/components/delivery-matching-flow";
import { checkoutIntentIdSchema } from "@/features/delivery-matching/schema";
import { CheckoutIntentService } from "@/features/delivery-matching/server/checkout-intent-service";
import { getServerGuestSession } from "@/server/guest-session";

export const metadata: Metadata = {
  title: "Delivery matching",
  description: "Choose a simulated delivery profile for your MOB GREENS order.",
  robots: { index: false, follow: false },
};

export default async function DeliveryMatchingPage({
  searchParams,
}: {
  searchParams: Promise<{ intent?: string }>;
}) {
  const parsed = checkoutIntentIdSchema.safeParse((await searchParams).intent);
  if (!parsed.success) notFound();
  const guest = await getServerGuestSession();
  if (!guest) notFound();
  const intent = await new CheckoutIntentService().getForGuest(
    guest.id,
    parsed.data,
  );
  if (!intent) notFound();
  if (intent.fulfillmentType !== "DELIVERY") {
    redirect(`/allverification?intent=${encodeURIComponent(intent.publicId)}`);
  }
  if (intent.status !== "SUBMITTED") {
    redirect(`/allverification?intent=${encodeURIComponent(intent.publicId)}`);
  }
  if (intent.status === "SUBMITTED" && !intent.paymentApproved) {
    redirect(
      intent.orderReference
        ? `/orders/${encodeURIComponent(intent.orderReference)}`
        : "/orders?tab=pending",
    );
  }

  const t = useTranslations("Checkout");
  return (
    <div className="min-h-dvh bg-background">
      <StoreHeader />
      <main className="mx-auto max-w-3xl px-4 py-6 sm:px-6 sm:py-10 lg:px-8">
        <Link
          href="/checkout"
          className="inline-flex min-h-11 items-center gap-1.5 text-sm font-semibold text-foreground-muted hover:text-foreground"
        >
          <ChevronLeft aria-hidden="true" className="size-4" />
          {t("backToOrderDetails")}
        </Link>
        <div className="mt-4 mb-7">
          <p className="text-sm font-semibold text-foreground-muted">
            {t("deliveryStep2")}
          </p>
          <h1 className="heading-display mt-2 text-balance">
            {t("chooseDeliveryProfile")}
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-foreground-muted sm:text-base">
            {t("deliveryDescription")}
          </p>
        </div>
        <DeliveryMatchingFlow initialIntent={intent} />
      </main>
    </div>
  );
}
