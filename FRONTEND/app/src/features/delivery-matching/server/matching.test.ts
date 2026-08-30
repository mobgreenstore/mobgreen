import { describe, expect, it } from "vitest";
import { SIMULATED_COURIER_PROFILES } from "@/features/delivery-matching/server/courier-catalogue";
import { generateSimulatedCourierCandidates } from "@/features/delivery-matching/server/matching";

describe("simulated courier matching", () => {
  it("owns exactly 30 stable unique profiles on the server", () => {
    expect(SIMULATED_COURIER_PROFILES).toHaveLength(30);
    expect(
      new Set(SIMULATED_COURIER_PROFILES.map((profile) => profile.id)).size,
    ).toBe(30);
    expect(
      new Set(SIMULATED_COURIER_PROFILES.map((profile) => profile.displayName))
        .size,
    ).toBe(30);
  });

  it("returns five to seven unique, bounded candidates", () => {
    const candidates = generateSimulatedCourierCandidates("guest:intent:place");
    expect(candidates.length).toBeGreaterThanOrEqual(5);
    expect(candidates.length).toBeLessThanOrEqual(7);
    expect(
      new Set(candidates.map((candidate) => candidate.profileId)).size,
    ).toBe(candidates.length);
    for (const candidate of candidates) {
      expect(candidate.distanceMeters).toBeGreaterThanOrEqual(700);
      expect(candidate.distanceMeters).toBeLessThanOrEqual(12_000);
      expect(candidate.estimatedDurationSeconds).toBeGreaterThanOrEqual(600);
    }
  });

  it("keeps matching metrics stable while issuing fresh opaque candidate IDs", () => {
    const first = generateSimulatedCourierCandidates("stable-checkout-seed");
    const second = generateSimulatedCourierCandidates("stable-checkout-seed");
    const stableSignature = (candidate: (typeof first)[number]) => [
      candidate.profileId,
      candidate.displayName,
      candidate.distanceMeters,
      candidate.estimatedDurationSeconds,
    ];
    expect(first.map(stableSignature)).toEqual(second.map(stableSignature));
    expect(first.map((candidate) => candidate.candidateId)).not.toEqual(
      second.map((candidate) => candidate.candidateId),
    );
    expect(new Set(first.map((candidate) => candidate.candidateId)).size).toBe(
      first.length,
    );
    for (const candidate of first) {
      expect(candidate.candidateId).toMatch(
        new RegExp("^[A-Za-z0-9_-]{20,64}$"),
      );
    }
    expect(first).toEqual(
      [...first].sort(
        (left, right) =>
          left.distanceMeters - right.distanceMeters ||
          left.estimatedDurationSeconds - right.estimatedDurationSeconds,
      ),
    );
  });

  it("does not return the same assignment for unrelated checkout seeds", () => {
    expect(generateSimulatedCourierCandidates("checkout-one")).not.toEqual(
      generateSimulatedCourierCandidates("checkout-two"),
    );
  });
});
