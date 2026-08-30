"use client";

import { Check, Clock3, MapPin, UserRound } from "lucide-react";
import { Button } from "@/components/ui";
import type { SimulatedCourierCandidate } from "@/features/delivery-matching/types";
import { cn } from "@/lib/utils";

function distanceLabel(distanceMeters: number) {
  return distanceMeters < 1_000
    ? `${distanceMeters} m`
    : `${(distanceMeters / 1_000).toFixed(1)} km`;
}

function durationLabel(durationSeconds: number) {
  return `${Math.max(1, Math.ceil(durationSeconds / 60))} min`;
}

export function CourierCandidateCard({
  candidate,
  selected,
  disabled,
  onSelect,
}: {
  candidate: SimulatedCourierCandidate;
  selected: boolean;
  disabled?: boolean | undefined;
  onSelect: (candidate: SimulatedCourierCandidate) => void;
}) {
  const label = `${candidate.displayName}, simulated ${distanceLabel(candidate.distanceMeters)} away, estimated ${durationLabel(candidate.estimatedDurationSeconds)}`;

  return (
    <article
      className={cn(
        "relative flex min-w-0 flex-col rounded-xl border bg-surface p-3 text-center transition-colors motion-reduce:transition-none sm:p-4",
        selected
          ? "border-info ring-2 ring-info/25"
          : "border-border hover:border-border-strong",
      )}
    >
      {selected && (
        <span className="absolute top-2 right-2 grid size-5 place-items-center rounded-full bg-info text-white">
          <Check aria-hidden="true" className="size-3.5" strokeWidth={2.5} />
          <span className="sr-only">Selected</span>
        </span>
      )}
      <div className="mx-auto grid size-12 place-items-center rounded-full bg-surface-subtle sm:size-14">
        <UserRound aria-hidden="true" className="size-6" strokeWidth={1.8} />
      </div>
      <h3
        className="mt-3 truncate text-sm font-semibold"
        title={candidate.displayName}
      >
        {candidate.displayName}
      </h3>
      <dl className="mt-2 grid gap-1 text-xs text-foreground-muted">
        <div className="flex items-center justify-center gap-1">
          <MapPin aria-hidden="true" className="size-3.5" />
          <dt className="sr-only">Simulated distance</dt>
          <dd>{distanceLabel(candidate.distanceMeters)}</dd>
        </div>
        <div className="flex items-center justify-center gap-1">
          <Clock3 aria-hidden="true" className="size-3.5" />
          <dt className="sr-only">Estimated delivery time</dt>
          <dd>{durationLabel(candidate.estimatedDurationSeconds)}</dd>
        </div>
      </dl>
      <Button
        type="button"
        variant={selected ? "primary" : "secondary"}
        size="small"
        className="mt-3 w-full"
        disabled={disabled}
        aria-label={`${selected ? "Selected" : "Choose"} ${label}`}
        aria-pressed={selected}
        onClick={() => onSelect(candidate)}
      >
        {selected ? "Selected" : "Choose"}
      </Button>
    </article>
  );
}
