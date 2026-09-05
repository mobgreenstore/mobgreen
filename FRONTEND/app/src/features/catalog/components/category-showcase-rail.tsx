"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Layers3 } from "lucide-react";
import { IconButton } from "@/components/ui/icon-button";
import { EmptyState } from "@/components/ui/empty-state";
import {
  getCategoryDisplayTone,
  type CategoryDisplayTone,
} from "@/config/category-presentation";
import { CategoryShowcaseCard } from "@/features/catalog/components/category-showcase-card";
import type {
  CatalogCategoryViewModel,
  CatalogSort,
} from "@/features/catalog/types";

const COMMIT_DELAY_MS = 480;

export function CategoryShowcaseRail({
  categories,
  activeCategorySlug,
  search,
  sort,
  displayTone,
  onFocusedCategoryChange,
  onFocusedCategoryCommit,
}: {
  categories: readonly CatalogCategoryViewModel[];
  activeCategorySlug: string;
  search: string;
  sort: CatalogSort;
  displayTone: CategoryDisplayTone;
  onFocusedCategoryChange: (slug: string) => void;
  onFocusedCategoryCommit: (slug: string) => void;
}) {
  const tone = getCategoryDisplayTone(displayTone);
  const viewportRef = useRef<HTMLDivElement>(null);
  const interactionRef = useRef(false);
  const commitTimerRef = useRef<number | null>(null);
  const [edges, setEdges] = useState({ left: false, right: false });

  const nearestIndex = useCallback(() => {
    const viewport = viewportRef.current;
    if (!viewport) return 0;
    const cards = Array.from(
      viewport.querySelectorAll<HTMLElement>("[data-showcase-item]"),
    );
    if (!cards.length) return 0;
    const viewportCenter = viewport.scrollLeft + viewport.clientWidth / 2;
    return cards.reduce(
      (nearest, card, index) => {
        const cardCenter = card.offsetLeft + card.offsetWidth / 2;
        const distance = Math.abs(cardCenter - viewportCenter);
        return distance < nearest.distance ? { index, distance } : nearest;
      },
      { index: 0, distance: Number.POSITIVE_INFINITY },
    ).index;
  }, []);

  const updateEdges = useCallback(() => {
    const viewport = viewportRef.current;
    if (!viewport) return;
    const maxScroll = viewport.scrollWidth - viewport.clientWidth;
    setEdges({
      left: viewport.scrollLeft > 2,
      right: viewport.scrollLeft < maxScroll - 2,
    });
  }, []);

  const focusNearest = useCallback(() => {
    if (!interactionRef.current || !categories.length) return;
    const category = categories[nearestIndex()];
    if (!category) return;
    onFocusedCategoryChange(category.slug);
    if (commitTimerRef.current !== null) {
      window.clearTimeout(commitTimerRef.current);
    }
    commitTimerRef.current = window.setTimeout(() => {
      onFocusedCategoryCommit(category.slug);
      interactionRef.current = false;
    }, COMMIT_DELAY_MS);
  }, [
    categories,
    nearestIndex,
    onFocusedCategoryChange,
    onFocusedCategoryCommit,
  ]);

  useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport) return;
    updateEdges();
    const observer = new ResizeObserver(updateEdges);
    observer.observe(viewport);
    return () => observer.disconnect();
  }, [categories.length, updateEdges]);

  useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport || !activeCategorySlug) return;
    const card = viewport.querySelector<HTMLElement>(
      `[data-showcase-item="${CSS.escape(activeCategorySlug)}"]`,
    );
    card?.scrollIntoView({
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
        ? "auto"
        : "smooth",
      block: "nearest",
      inline: "center",
    });
  }, [activeCategorySlug]);

  useEffect(
    () => () => {
      if (commitTimerRef.current !== null) {
        window.clearTimeout(commitTimerRef.current);
      }
    },
    [],
  );

  function handleScroll() {
    updateEdges();
    focusNearest();
  }

  function scrollByCard(direction: -1 | 1) {
    const viewport = viewportRef.current;
    if (!viewport || !categories.length) return;
    const index = Math.min(
      categories.length - 1,
      Math.max(0, nearestIndex() + direction),
    );
    const card = viewport.querySelectorAll<HTMLElement>("[data-showcase-item]")[
      index
    ];
    if (!card) return;
    interactionRef.current = true;
    card.scrollIntoView({
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
        ? "auto"
        : "smooth",
      block: "nearest",
      inline: "center",
    });
    const category = categories[index];
    if (category) {
      onFocusedCategoryChange(category.slug);
      onFocusedCategoryCommit(category.slug);
      interactionRef.current = false;
    }
  }

  if (!categories.length) {
    return (
      <section
        aria-label="Category showcase"
        className={`${tone.surfaceClassName} px-3 py-4 transition-colors duration-200 motion-reduce:transition-none sm:px-6 sm:py-5 lg:px-8`}
      >
        <div className="mx-auto max-w-[var(--content-max)]">
          <EmptyState
            icon={<Layers3 aria-hidden="true" className="size-5" />}
            title="No categories available yet"
            description="The store administrator has not activated any categories."
            compact
            className="border-0 bg-black/5"
          />
        </div>
      </section>
    );
  }

  return (
    <section
      aria-label="Category showcase"
      className={`catalog-showcase-rail ${tone.surfaceClassName} py-3 transition-colors duration-200 motion-reduce:transition-none sm:py-5`}
    >
      <div className="mx-auto max-w-[var(--content-max)]">
        <div className="mb-3 hidden items-center justify-end gap-2 px-6 md:flex lg:px-8">
          <IconButton
            aria-label="Previous category"
            onClick={() => scrollByCard(-1)}
            disabled={!edges.left}
            className="rounded-full border border-current/20 bg-black/5 text-inherit backdrop-blur-sm"
          >
            <ChevronLeft aria-hidden="true" className="size-5" />
          </IconButton>
          <IconButton
            aria-label="Next category"
            onClick={() => scrollByCard(1)}
            disabled={!edges.right}
            className="rounded-full border border-current/20 bg-black/5 text-inherit backdrop-blur-sm"
          >
            <ChevronRight aria-hidden="true" className="size-5" />
          </IconButton>
        </div>
        <div
          ref={viewportRef}
          onPointerDown={() => {
            interactionRef.current = true;
          }}
          onWheel={() => {
            interactionRef.current = true;
          }}
          onScroll={handleScroll}
          className="flex touch-pan-x snap-x snap-mandatory scroll-px-3 scrollbar-none gap-3 overflow-x-auto overscroll-x-contain px-3 pr-12 pb-2 sm:scroll-px-6 sm:gap-4 sm:px-6 sm:pr-20 lg:scroll-px-8 lg:px-8 lg:pr-24"
        >
          {categories.map((category, index) => (
            <div
              key={category.id}
              data-showcase-item={category.slug}
              className="shrink-0 basis-[66vw] snap-center sm:basis-[17.5rem] lg:basis-[20rem]"
            >
              <CategoryShowcaseCard
                category={category}
                search={search}
                sort={sort}
                priority={index === 0}
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
