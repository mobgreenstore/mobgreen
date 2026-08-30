import type { ReactNode } from "react";
import { StoreHeader } from "@/components/shared/store-header";

export function CheckoutPageShell({
  children,
  label,
}: {
  children: ReactNode;
  label: string;
}) {
  return (
    <div className="min-h-dvh bg-background">
      <StoreHeader />
      <main
        aria-label={label}
        className="mx-auto max-w-[var(--content-max)] px-4 py-5 sm:px-6 sm:py-9 lg:px-8 lg:py-12"
      >
        {children}
      </main>
    </div>
  );
}
