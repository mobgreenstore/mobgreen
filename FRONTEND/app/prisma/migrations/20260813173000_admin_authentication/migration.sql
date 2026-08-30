-- Extend the administrator record for revocable sessions and login auditing.
ALTER TABLE "admin_users"
ADD COLUMN "sessionVersion" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN "lastLoginAt" TIMESTAMPTZ(3);

-- Persist failed-login windows so throttling survives restarts and deployments.
CREATE TABLE "admin_login_throttles" (
  "keyHash" VARCHAR(64) NOT NULL,
  "failedAttempts" INTEGER NOT NULL DEFAULT 0,
  "windowStartedAt" TIMESTAMPTZ(3) NOT NULL,
  "lockedUntil" TIMESTAMPTZ(3),
  "updatedAt" TIMESTAMPTZ(3) NOT NULL,
  CONSTRAINT "admin_login_throttles_pkey" PRIMARY KEY ("keyHash")
);

CREATE INDEX "admin_login_throttles_lockedUntil_idx"
ON "admin_login_throttles"("lockedUntil");
