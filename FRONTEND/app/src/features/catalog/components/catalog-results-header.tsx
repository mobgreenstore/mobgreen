import type { ReactNode } from "react";

export function CatalogResultsHeader({
  categoryName,
  resultCount,
  toolbar,
}: {
  categoryName: string;
  resultCount: number;
  toolbar: ReactNode;
}) {
  const countLabel =
    resultCount === 1 ? "1 product" : `${resultCount} products`;

  return (
    <header className="flex min-w-0 items-center justify-between gap-3">
      <div className="min-w-0">
        <h1 className="truncate text-xl font-semibold tracking-[-0.035em] sm:text-2xl">
          {categoryName}
        </h1>
        <p
          className="mt-0.5 text-xs font-medium text-foreground-muted sm:text-sm"
          aria-live="polite"
        >
          {countLabel}
        </p>
      </div>
      {toolbar}
    </header>
  );
}
