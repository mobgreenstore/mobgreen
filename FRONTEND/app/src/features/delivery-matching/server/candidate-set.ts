import "server-only";

import { createHash } from "node:crypto";
import { z } from "zod";
import type { Prisma } from "@/generated/prisma/client";
import type { SimulatedCourierCandidate } from "@/features/delivery-matching/types";

export interface StoredSimulatedCourierCandidate extends SimulatedCourierCandidate {
  profileId: string;
}

const candidateMetricsSchema = z.object({
  displayName: z.string().min(1).max(80),
  distanceMeters: z.number().int().min(0).max(100_000),
  estimatedDurationSeconds: z
    .number()
    .int()
    .min(60)
    .max(24 * 60 * 60),
});

const currentCandidateSchema = candidateMetricsSchema.extend({
  candidateId: z
    .string()
    .min(20)
    .max(64)
    .regex(/^[A-Za-z0-9_-]+$/),
  profileId: z.string().min(1).max(64),
});

const legacyCandidateSchema = candidateMetricsSchema.extend({
  profileId: z.string().min(1).max(64),
});

const storedCandidateSetSchema = z
  .array(z.union([currentCandidateSchema, legacyCandidateSchema]))
  .max(30);

function legacyCandidateId(candidate: z.output<typeof legacyCandidateSchema>) {
  return `legacy_${createHash("sha256")
    .update(
      [
        candidate.profileId,
        candidate.displayName,
        candidate.distanceMeters,
        candidate.estimatedDurationSeconds,
      ].join(":"),
    )
    .digest("base64url")
    .slice(0, 24)}`;
}

export function parseStoredCourierCandidates(
  value: Prisma.JsonValue | null,
): StoredSimulatedCourierCandidate[] {
  const parsed = storedCandidateSetSchema.safeParse(value);
  if (!parsed.success) return [];
  return parsed.data.map((candidate) => ({
    candidateId:
      "candidateId" in candidate
        ? candidate.candidateId
        : legacyCandidateId(candidate),
    profileId: candidate.profileId,
    displayName: candidate.displayName,
    distanceMeters: candidate.distanceMeters,
    estimatedDurationSeconds: candidate.estimatedDurationSeconds,
  }));
}

export function toPublicCourierCandidate(
  candidate: StoredSimulatedCourierCandidate,
): SimulatedCourierCandidate {
  return {
    candidateId: candidate.candidateId,
    displayName: candidate.displayName,
    distanceMeters: candidate.distanceMeters,
    estimatedDurationSeconds: candidate.estimatedDurationSeconds,
  };
}

export function parseSimulatedCourierCandidates(
  value: Prisma.JsonValue | null,
): SimulatedCourierCandidate[] {
  return parseStoredCourierCandidates(value).map(toPublicCourierCandidate);
}
