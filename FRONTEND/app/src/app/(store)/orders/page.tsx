import Link from "next/link";
import { CustomerOrdersList } from "@/features/customer-orders/components/customer-orders-list";

export default function OrdersPage() {
  return (
    <main className="mx-auto min-h-dvh max-w-4xl px-4 py-8 sm:px-6">
      <Link
        href="/"
        className="text-sm font-semibold underline underline-offset-4"
      >
        Back to catalog
      </Link>
      <h1 className="mt-6 text-3xl font-semibold tracking-[-0.05em]">
        Your orders
      </h1>
      <p className="mt-2 mb-8 text-sm text-foreground-muted">
        Private orders linked to this browser session.
      </p>
      <CustomerOrdersList />
    </main>
  );
}
