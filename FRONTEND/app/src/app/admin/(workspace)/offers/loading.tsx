import { Skeleton } from "@/components/ui";

export default function AdminOffersLoading() {
  return (
    <div className="mx-auto max-w-6xl" aria-label="Loading special offers">
      <Skeleton className="h-8 w-36" />
      <Skeleton className="mt-4 h-12 w-full max-w-xl" />
      <div className="mt-8 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }, (_, index) => (
          <Skeleton key={index} className="h-32" />
        ))}
      </div>
      <Skeleton className="mt-6 h-20" />
      <div className="mt-6 grid gap-3">
        {Array.from({ length: 3 }, (_, index) => (
          <Skeleton key={index} className="h-36" />
        ))}
      </div>
    </div>
  );
}
