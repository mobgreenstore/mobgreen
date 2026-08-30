-- Secure guest sessions and shared public request throttling.
CREATE TYPE "PublicRequestScope" AS ENUM ('GEOCODING', 'CUSTOMER_ORDERS');

CREATE TABLE "guest_sessions" (
  "id" UUID NOT NULL,
  "tokenHash" VARCHAR(64) NOT NULL,
  "expiresAt" TIMESTAMPTZ(3) NOT NULL,
  "lastSeenAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMPTZ(3) NOT NULL,
  CONSTRAINT "guest_sessions_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "public_request_throttles" (
  "scope" "PublicRequestScope" NOT NULL,
  "keyHash" VARCHAR(64) NOT NULL,
  "requestCount" INTEGER NOT NULL DEFAULT 0,
  "windowStartedAt" TIMESTAMPTZ(3) NOT NULL,
  "updatedAt" TIMESTAMPTZ(3) NOT NULL,
  CONSTRAINT "public_request_throttles_pkey" PRIMARY KEY ("scope", "keyHash")
);

ALTER TABLE "orders" ADD COLUMN "guestSessionId" UUID;

CREATE UNIQUE INDEX "guest_sessions_tokenHash_key" ON "guest_sessions"("tokenHash");
CREATE INDEX "guest_sessions_expiresAt_idx" ON "guest_sessions"("expiresAt");
CREATE INDEX "orders_guestSessionId_createdAt_idx" ON "orders"("guestSessionId", "createdAt");
CREATE INDEX "public_request_throttles_windowStartedAt_idx" ON "public_request_throttles"("windowStartedAt");

ALTER TABLE "orders"
ADD CONSTRAINT "orders_guestSessionId_fkey"
FOREIGN KEY ("guestSessionId") REFERENCES "guest_sessions"("id")
ON DELETE SET NULL ON UPDATE CASCADE;
