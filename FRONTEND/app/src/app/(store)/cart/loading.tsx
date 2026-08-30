import { StoreHeader } from "@/components/shared/store-header";
import { Skeleton, SkeletonGroup } from "@/components/ui";

export default function CartLoading() {
  return (
    <div className="min-h-dvh bg-background">
      <StoreHeader />
      <main className="mx-auto max-w-[var(--content-max)] px-4 py-8 sm:px-6 lg:px-8">
        <SkeletonGroup label="Loading your cart" className="grid gap-5">
          <Skeleton className="h-12 w-52" />
          <Skeleton className="h-28 w-full rounded-lg" />
          <Skeleton className="h-28 w-full rounded-lg" />
        </SkeletonGroup>
      </main>
    </div>
  );
}
