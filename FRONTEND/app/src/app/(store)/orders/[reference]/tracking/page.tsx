import Link from "next/link";
import { notFound } from "next/navigation";
import { CustomerOrderTracking } from "@/features/customer-orders/components/customer-order-tracking";
import { getGuestTracking } from "@/features/customer-orders/server/queries";
import { getServerGuestSession } from "@/server/guest-session";

export const dynamic = "force-dynamic";

export default async function TrackingPage({
  params,
}: {
  params: Promise<{ reference: string }>;
}) {
  const { reference } = await params;
  const guest = await getServerGuestSession();
  if (!guest) notFound();
  const tracking = await getGuestTracking(guest.id, reference);
  if (!tracking) notFound();

  return (
    <main className="mx-auto min-h-dvh max-w-5xl px-3 pt-[max(1rem,env(safe-area-inset-top))] pb-[max(2rem,env(safe-area-inset-bottom))] sm:px-6 sm:pt-8">
      <Link
        href={`/orders/${encodeURIComponent(reference)}`}
        className="inline-flex min-h-11 items-center text-sm font-semibold underline underline-offset-4"
      >
        Back to order
      </Link>
      <div className="mt-4 mb-6">
        <p className="text-xs font-semibold tracking-[0.08em] text-foreground-subtle uppercase">
          MOB GREENS delivery
        </p>
        <h1 className="mt-1 text-3xl font-semibold tracking-[-0.05em]">
          Track your order
        </h1>
      </div>
      <CustomerOrderTracking reference={reference} initialTracking={tracking} />
    </main>
  );
}
