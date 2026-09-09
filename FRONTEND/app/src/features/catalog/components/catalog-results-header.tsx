import type { ReactNode } from "react";
import { useTranslations } from "next-intl";

export function CatalogResultsHeader({
  categoryName,
  resultCount,
  toolbar,
}: {
  categoryName: string;
  resultCount: number;
  toolbar: ReactNode;
}) {
  const t = useTranslations("Catalog");
  const countLabel =
    resultCount === 1
      ? t("oneProduct")
      : t("multipleProducts", { count: resultCount });

  return (
    <header className="flex min-w-0 items-center justify-between gap-3">
      <div className="min-w-0">
        <h1 className="truncate text-base font-semibold tracking-[-0.035em] sm:text-lg">
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
