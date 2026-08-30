import { Skeleton, SkeletonGroup } from "@/components/ui";

export default function OrdersLoading() {
  return (
    <SkeletonGroup
      label="Loading orders"
      className="mx-auto grid max-w-7xl gap-5"
    >
      <Skeleton className="h-10 w-52" />
      <Skeleton className="h-32 w-full rounded-lg" />
      <Skeleton className="h-80 w-full rounded-lg" />
    </SkeletonGroup>
  );
}
