import Link from "next/link";
import { useTranslations } from "next-intl";
import { CustomerOrdersList } from "@/features/customer-orders/components/customer-orders-list";

export default function OrdersPage() {
  const t = useTranslations("Orders");
  return (
    <main className="mx-auto min-h-dvh max-w-4xl px-4 py-8 sm:px-6">
      <Link
        href="/"
        className="text-sm font-semibold underline underline-offset-4"
      >
        {t("backToCatalog")}
      </Link>
      <h1 className="mt-6 text-3xl font-semibold tracking-[-0.05em]">
        {t("title")}
      </h1>
      <p className="mt-2 mb-8 text-sm text-foreground-muted">
        {t("privateOrders")}
      </p>
      <CustomerOrdersList />
    </main>
  );
}
