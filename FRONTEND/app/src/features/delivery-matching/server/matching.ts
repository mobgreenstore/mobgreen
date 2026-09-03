import "server-only";

import { createHash, randomBytes } from "node:crypto";
import { SIMULATED_COURIER_PROFILES } from "@/features/delivery-matching/server/courier-catalogue";
import type { StoredSimulatedCourierCandidate } from "@/features/delivery-matching/server/candidate-set";

function digest(seed: string, scope: string) {
  return createHash("sha256").update(seed).update(":").update(scope).digest();
}

function numberFrom(buffer: Buffer, offset: number) {
  return buffer.readUInt32BE(offset % (buffer.length - 4));
}

export function generateSimulatedCourierCandidates(
  seed: string,
): StoredSimulatedCourierCandidate[] {
  const root = digest(seed, "candidate-count");
  const count = 5 + (root[0]! % 3);
  return SIMULATED_COURIER_PROFILES.map((profile) => {
    const score = digest(seed, profile.id);
    const distanceMeters = 700 + (numberFrom(score, 4) % 11_301);
    const trafficDelaySeconds = numberFrom(score, 12) % 481;
    const travelSeconds = Math.ceil(distanceMeters / 4.6);
    return {
      candidateId: randomBytes(18).toString("base64url"),
      profileId: profile.id,
      displayName: profile.displayName,
      distanceMeters,
      estimatedDurationSeconds: Math.max(
        10 * 60,
        travelSeconds + trafficDelaySeconds + 6 * 60,
      ),
      ranking: numberFrom(score, 0),
    };
  })
    .sort((left, right) => left.ranking - right.ranking)
    .slice(0, count)
    .map((candidate) => ({
      candidateId: candidate.candidateId,
      profileId: candidate.profileId,
      displayName: candidate.displayName,
      distanceMeters: candidate.distanceMeters,
      estimatedDurationSeconds: candidate.estimatedDurationSeconds,
    }))
    .sort(
      (left, right) =>
        left.distanceMeters - right.distanceMeters ||
        left.estimatedDurationSeconds - right.estimatedDurationSeconds,
    )
    .reduce<StoredSimulatedCourierCandidate[]>((matched, candidate) => {
      const previous = matched.at(-1);
      const estimatedDurationSeconds = Math.max(
        candidate.estimatedDurationSeconds,
        previous ? previous.estimatedDurationSeconds + 20 : 10 * 60,
      );
      matched.push({ ...candidate, estimatedDurationSeconds });
      return matched;
    }, []);
}
