"use client";

import Link from "next/link";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent,
} from "react";
import {
  getCategoryDisplayTone,
  type CategoryDisplayTone,
} from "@/config/category-presentation";
import { catalogHref } from "@/features/catalog/params";
import type {
  CatalogCategoryViewModel,
  CatalogSort,
} from "@/features/catalog/types";
import { cn } from "@/lib/utils";

export function CategoryTabRail({
  categories,
  activeCategorySlug,
  search,
  sort,
  displayTone,
}: {
  categories: readonly CatalogCategoryViewModel[];
  activeCategorySlug: string;
  search: string;
  sort: CatalogSort;
  displayTone: CategoryDisplayTone;
}) {
  const viewportRef = useRef<HTMLDivElement>(null);
  const [edges, setEdges] = useState({ left: false, right: false });
  const tone = getCategoryDisplayTone(displayTone);

  const updateEdges = useCallback(() => {
    const viewport = viewportRef.current;
    if (!viewport) return;
    const maxScroll = viewport.scrollWidth - viewport.clientWidth;
    setEdges({
      left: viewport.scrollLeft > 2,
      right: viewport.scrollLeft < maxScroll - 2,
    });
  }, []);

  useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport) return;
    const active = viewport.querySelector<HTMLElement>('[aria-current="page"]');
    active?.scrollIntoView({
      behavior:
        typeof window.matchMedia === "function" &&
        window.matchMedia("(prefers-reduced-motion: reduce)").matches
          ? "auto"
          : "smooth",
      block: "nearest",
      inline: "center",
    });
    updateEdges();
    const observer = new ResizeObserver(updateEdges);
    observer.observe(viewport);
    return () => observer.disconnect();
  }, [activeCategorySlug, categories.length, updateEdges]);

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (
      event.key !== "ArrowLeft" &&
      event.key !== "ArrowRight" &&
      event.key !== "Home" &&
      event.key !== "End"
    ) {
      return;
    }
    const links = Array.from(
      event.currentTarget.querySelectorAll<HTMLAnchorElement>(
        "[data-category-tab]",
      ),
    );
    if (!links.length) return;
    const current = links.indexOf(document.activeElement as HTMLAnchorElement);
    let next = current < 0 ? 0 : current;
    if (event.key === "Home") next = 0;
    if (event.key === "End") next = links.length - 1;
    if (event.key === "ArrowLeft") next = Math.max(0, next - 1);
    if (event.key === "ArrowRight") next = Math.min(links.length - 1, next + 1);
    event.preventDefault();
    links[next]?.focus();
  }

  const tabClassName =
    "relative inline-flex min-h-11 snap-start items-center whitespace-nowrap rounded-full border px-4 text-sm font-semibold transition-[color,background-color,border-color] motion-reduce:transition-none focus-visible:outline-offset-2";
  const activeClassName =
    "border-[var(--category-tab-active-border)] bg-[var(--category-tab-active-surface)] text-inherit shadow-sm";
  const inactiveClassName =
    "border-current/20 bg-transparent text-inherit hover:border-current/45 hover:bg-black/5";

  if (!categories.length) return null;

  return (
    <nav
      aria-label="Product categories"
      className={cn("transition-colors duration-200", tone.surfaceClassName)}
      style={
        {
          "--category-rail-surface": tone.surfaceColor,
          "--category-rail-foreground": tone.foregroundColor,
          "--category-tab-active-surface": `color-mix(in srgb, ${tone.surfaceColor} 72%, ${tone.foregroundColor} 28%)`,
          "--category-tab-active-border": `color-mix(in srgb, ${tone.foregroundColor} 34%, transparent)`,
        } as CSSProperties
      }
    >
      <div className="relative mx-auto max-w-[var(--content-max)]">
        <div
          ref={viewportRef}
          onScroll={updateEdges}
          onKeyDown={handleKeyDown}
          className="flex snap-x snap-mandatory scrollbar-none gap-2 overflow-x-auto px-3 py-2.5 sm:px-5 lg:px-8"
        >
          {categories.map((category) => {
            const active = category.slug === activeCategorySlug;
            return (
              <Link
                key={category.id}
                data-category-tab
                href={catalogHref({
                  category: category.slug,
                  search,
                  sort,
                })}
                aria-current={active ? "page" : undefined}
                className={cn(
                  tabClassName,
                  active ? activeClassName : inactiveClassName,
                )}
              >
                {category.name}
                {active && (
                  <span
                    aria-hidden="true"
                    className="absolute inset-x-4 bottom-1 h-0.5 rounded-full bg-current opacity-65"
                  />
                )}
              </Link>
            );
          })}
        </div>
        {edges.left && (
          <span
            aria-hidden="true"
            className="pointer-events-none absolute inset-y-0 left-0 w-7"
            style={{
              background:
                "linear-gradient(to right, var(--category-rail-surface), transparent)",
            }}
          />
        )}
        {edges.right && (
          <span
            aria-hidden="true"
            className="pointer-events-none absolute inset-y-0 right-0 w-7"
            style={{
              background:
                "linear-gradient(to left, var(--category-rail-surface), transparent)",
            }}
          />
        )}
      </div>
    </nav>
  );
}
