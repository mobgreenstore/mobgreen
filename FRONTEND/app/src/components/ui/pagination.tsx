import { ChevronLeft, ChevronRight, MoreHorizontal } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

export type PaginationItem = number | "ellipsis";

export function getPaginationItems(
  currentPage: number,
  totalPages: number,
): PaginationItem[] {
  if (totalPages <= 7)
    return Array.from(
      { length: Math.max(0, totalPages) },
      (_, index) => index + 1,
    );
  if (currentPage <= 4) return [1, 2, 3, 4, 5, "ellipsis", totalPages];
  if (currentPage >= totalPages - 3) {
    return [
      1,
      "ellipsis",
      totalPages - 4,
      totalPages - 3,
      totalPages - 2,
      totalPages - 1,
      totalPages,
    ];
  }
  return [
    1,
    "ellipsis",
    currentPage - 1,
    currentPage,
    currentPage + 1,
    "ellipsis",
    totalPages,
  ];
}

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  getHref: (page: number) => string;
  className?: string;
  label?: string;
}

export function Pagination({
  currentPage,
  totalPages,
  getHref,
  className,
  label = "Pagination",
}: PaginationProps) {
  if (totalPages <= 1) return null;
  const current = Math.min(Math.max(currentPage, 1), totalPages);

  return (
    <nav
      aria-label={label}
      className={cn("flex items-center justify-between gap-3", className)}
    >
      <Link
        href={getHref(Math.max(1, current - 1))}
        aria-disabled={current === 1}
        tabIndex={current === 1 ? -1 : undefined}
        className={cn(
          "inline-flex min-h-11 items-center gap-1.5 rounded-md border border-border bg-surface px-3 text-sm font-semibold",
          current === 1 && "pointer-events-none opacity-45",
        )}
      >
        <ChevronLeft aria-hidden="true" className="size-4" />
        <span className="hidden sm:inline">Previous</span>
      </Link>

      <div className="hidden items-center gap-1 sm:flex">
        {getPaginationItems(current, totalPages).map((item, index) =>
          item === "ellipsis" ? (
            <span
              key={`ellipsis-${index}`}
              className="grid size-10 place-items-center text-foreground-subtle"
            >
              <MoreHorizontal aria-hidden="true" className="size-4" />
              <span className="sr-only">More pages</span>
            </span>
          ) : (
            <Link
              key={item}
              href={getHref(item)}
              aria-label={`Page ${item}`}
              aria-current={item === current ? "page" : undefined}
              className={cn(
                "grid size-10 place-items-center rounded-md text-sm font-semibold hover:bg-surface-subtle",
                item === current &&
                  "bg-inverse text-inverse-foreground hover:bg-inverse",
              )}
            >
              {item}
            </Link>
          ),
        )}
      </div>

      <span className="text-sm font-medium text-foreground-muted sm:hidden">
        Page {current} of {totalPages}
      </span>

      <Link
        href={getHref(Math.min(totalPages, current + 1))}
        aria-disabled={current === totalPages}
        tabIndex={current === totalPages ? -1 : undefined}
        className={cn(
          "inline-flex min-h-11 items-center gap-1.5 rounded-md border border-border bg-surface px-3 text-sm font-semibold",
          current === totalPages && "pointer-events-none opacity-45",
        )}
      >
        <span className="hidden sm:inline">Next</span>
        <ChevronRight aria-hidden="true" className="size-4" />
      </Link>
    </nav>
  );
}
