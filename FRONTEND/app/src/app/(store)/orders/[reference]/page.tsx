import Link from "next/link";
import { notFound } from "next/navigation";
import { CustomerOrderDetailView } from "@/features/customer-orders/components/customer-order-detail";
import { getGuestOrder } from "@/features/customer-orders/server/queries";
import { getServerGuestSession } from "@/server/guest-session";

export const dynamic = "force-dynamic";

export default async function OrderPage({
  params,
}: {
  params: Promise<{ reference: string }>;
}) {
  const { reference } = await params;
  const guest = await getServerGuestSession();
  if (!guest) notFound();
  const order = await getGuestOrder(guest.id, reference);
  if (!order) notFound();
  return (
    <main className="mx-auto min-h-dvh max-w-3xl px-4 py-8 sm:px-6">
      <Link
        href="/orders"
        className="text-sm font-semibold underline underline-offset-4"
      >
        Back to orders
      </Link>
      <p className="mt-6 text-sm font-semibold text-foreground-muted">
        Order reference
      </p>
      <h1 className="mt-1 text-3xl font-semibold tracking-[-0.05em]">
        {reference}
      </h1>
      <div className="mt-8">
        <CustomerOrderDetailView reference={reference} initialOrder={order} />
      </div>
    </main>
  );
}
