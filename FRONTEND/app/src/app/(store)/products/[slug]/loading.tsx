import { StoreHeader } from "@/components/shared/store-header";
import { Skeleton, SkeletonGroup } from "@/components/ui";

export default function ProductLoading() {
  return (
    <div className="min-h-dvh bg-background">
      <StoreHeader />
      <SkeletonGroup
        label="Loading product"
        className="mx-auto grid max-w-[var(--content-max)] gap-8 px-4 py-10 sm:px-6 lg:grid-cols-2 lg:px-8"
      >
        <Skeleton className="aspect-square w-full" />
        <div>
          <Skeleton className="h-6 w-28" />
          <Skeleton className="mt-5 h-12 w-4/5" />
          <Skeleton className="mt-4 h-6 w-full" />
          <Skeleton className="mt-8 h-56 w-full" />
        </div>
      </SkeletonGroup>
    </div>
  );
}
