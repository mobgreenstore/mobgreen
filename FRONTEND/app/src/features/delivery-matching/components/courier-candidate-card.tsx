"use client";

import { Check, Clock3, MapPin } from "lucide-react";
import { Button } from "@/components/ui";
import type { SimulatedCourierCandidate } from "@/features/delivery-matching/types";
import { cn } from "@/lib/utils";
import { CourierAvatar } from "./courier-avatar";

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
        "relative flex min-w-0 flex-col rounded-xl border bg-surface p-3 text-left transition-colors motion-reduce:transition-none sm:p-4",
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
      <div className="flex items-center gap-3">
        <CourierAvatar
          seed={candidate.candidateId}
          className="size-11 sm:size-12"
        />
        <div className="min-w-0">
          <p className="text-[0.6875rem] font-semibold tracking-[0.09em] text-foreground-subtle uppercase">
            Nearby courier
          </p>
          <h3
            className="mt-0.5 truncate text-sm font-semibold"
            title={candidate.displayName}
          >
            {candidate.displayName}
          </h3>
        </div>
      </div>
      <dl className="mt-4 grid grid-cols-2 gap-2 border-y border-border py-3 text-xs text-foreground-muted">
        <div className="flex items-center gap-1.5">
          <MapPin aria-hidden="true" className="size-3.5" />
          <dt className="sr-only">Simulated distance</dt>
          <dd className="font-medium text-foreground">
            {distanceLabel(candidate.distanceMeters)}
          </dd>
        </div>
        <div className="flex items-center gap-1.5">
          <Clock3 aria-hidden="true" className="size-3.5" />
          <dt className="sr-only">Estimated delivery time</dt>
          <dd className="font-medium text-foreground">
            {durationLabel(candidate.estimatedDurationSeconds)}
          </dd>
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
