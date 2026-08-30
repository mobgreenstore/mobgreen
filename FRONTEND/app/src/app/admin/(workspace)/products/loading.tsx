import { Skeleton, SkeletonGroup } from "@/components/ui";

export default function ProductsLoading() {
  return (
    <SkeletonGroup label="Loading products" className="mx-auto max-w-7xl">
      <Skeleton className="h-10 w-56" />
      <Skeleton className="mt-3 h-5 max-w-xl" />
      <Skeleton className="mt-8 h-28 w-full" />
      <div className="mt-6 grid gap-3">
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-full" />
      </div>
    </SkeletonGroup>
  );
}
