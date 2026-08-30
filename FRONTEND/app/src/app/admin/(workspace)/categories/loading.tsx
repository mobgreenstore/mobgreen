import { Skeleton, SkeletonGroup } from "@/components/ui";

export default function CategoriesLoading() {
  return (
    <SkeletonGroup label="Loading categories" className="mx-auto max-w-6xl">
      <Skeleton className="h-10 w-56" />
      <Skeleton className="mt-3 h-5 max-w-xl" />
      <Skeleton className="mt-8 h-20 w-full" />
      <div className="mt-6 grid gap-3">
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-20 w-full" />
      </div>
    </SkeletonGroup>
  );
}
