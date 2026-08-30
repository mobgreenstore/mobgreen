import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export function ProductGrid({
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "grid grid-cols-2 gap-2.5 xs:gap-3 sm:gap-4 md:grid-cols-3 xl:grid-cols-4",
        className,
      )}
      {...props}
    />
  );
}
