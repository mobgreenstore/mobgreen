import Link from "next/link";
import { PackageX } from "lucide-react";
import { StoreHeader } from "@/components/shared/store-header";
import { EmptyState, buttonVariants } from "@/components/ui";
import { cn } from "@/lib/utils";

export default function ProductNotFound() {
  return (
    <div className="min-h-dvh bg-background">
      <StoreHeader />
      <main className="mx-auto max-w-[var(--content-max)] px-4 py-12 sm:px-6 lg:px-8">
        <EmptyState
          title="Product not found"
          description="This product does not exist or is no longer active."
          icon={<PackageX aria-hidden="true" className="size-5" />}
          action={
            <Link href="/" className={cn(buttonVariants())}>
              Browse active products
            </Link>
          }
        />
      </main>
    </div>
  );
}
