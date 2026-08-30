import { StoreHeader } from "@/components/shared/store-header";
import { Skeleton, SkeletonGroup } from "@/components/ui";

export default function CatalogLoading() {
  return (
    <div className="min-h-dvh bg-background">
      <StoreHeader />
      <SkeletonGroup label="Loading catalog">
        <div className="overflow-hidden py-4 sm:py-6">
          <div className="flex gap-3 px-3 pr-12 sm:px-6">
            <Skeleton className="h-[20rem] shrink-0 basis-[66vw] rounded-xl sm:h-[22.5rem] sm:basis-[17.5rem]" />
            <Skeleton className="h-[20rem] shrink-0 basis-[66vw] rounded-xl sm:h-[22.5rem] sm:basis-[17.5rem]" />
          </div>
        </div>
        <div className="mx-auto max-w-[var(--content-max)] px-3 py-6 sm:px-6 lg:px-8">
          <div className="flex items-end justify-between gap-4">
            <div className="min-w-0 flex-1">
              <Skeleton className="h-7 max-w-52" />
              <Skeleton className="mt-1 h-4 w-20" />
            </div>
            <Skeleton className="h-11 w-44" />
          </div>
          <div className="mt-5 grid grid-cols-2 gap-2.5 sm:gap-4 md:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: 8 }, (_, index) => (
              <div key={index}>
                <Skeleton className="aspect-square w-full rounded-lg" />
                <Skeleton className="mt-3 h-5 w-4/5" />
                <Skeleton className="mt-2 h-4 w-2/5" />
              </div>
            ))}
          </div>
        </div>
      </SkeletonGroup>
    </div>
  );
}
