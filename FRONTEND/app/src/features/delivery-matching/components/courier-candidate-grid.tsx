"use client";

import type { SimulatedCourierCandidate } from "@/features/delivery-matching/types";
import { CourierCandidateCard } from "./courier-candidate-card";

export function CourierCandidateGrid({
  candidates,
  selectedCandidateId,
  disabled,
  onSelect,
}: {
  candidates: SimulatedCourierCandidate[];
  selectedCandidateId?: string | null | undefined;
  disabled?: boolean | undefined;
  onSelect: (candidate: SimulatedCourierCandidate) => void;
}) {
  return (
    <div
      className="grid grid-cols-2 gap-3 min-[400px]:grid-cols-3 sm:gap-4"
      role="list"
      aria-label="Simulated nearby delivery profiles"
    >
      {candidates.map((candidate) => (
        <div key={candidate.candidateId} role="listitem" className="min-w-0">
          <CourierCandidateCard
            candidate={candidate}
            selected={candidate.candidateId === selectedCandidateId}
            disabled={disabled}
            onSelect={onSelect}
          />
        </div>
      ))}
    </div>
  );
}
