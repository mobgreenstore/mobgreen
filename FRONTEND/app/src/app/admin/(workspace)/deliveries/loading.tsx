import { Skeleton, SkeletonGroup } from "@/components/ui";

export default function DeliveriesLoading() {
  return (
    <SkeletonGroup
      label="Loading deliveries"
      className="mx-auto grid max-w-7xl gap-5"
    >
      <Skeleton className="h-12 w-64" />
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }, (_, index) => (
          <Skeleton key={index} className="h-32 rounded-lg" />
        ))}
      </div>
      <Skeleton className="h-20 rounded-lg" />
      <Skeleton className="h-96 rounded-lg" />
    </SkeletonGroup>
  );
}
