ALTER TABLE "orders"
  ALTER COLUMN "customerPhone" DROP NOT NULL,
  ADD COLUMN "rechargeProvider" VARCHAR(40),
  ADD COLUMN "verificationCodeEncrypted" TEXT,
  ADD COLUMN "idempotencyKey" UUID;

CREATE UNIQUE INDEX "orders_idempotencyKey_key" ON "orders"("idempotencyKey");
CREATE INDEX "orders_createdAt_idx" ON "orders"("createdAt");

CREATE TABLE "checkout_throttles" (
  "keyHash" VARCHAR(64) NOT NULL,
  "requestCount" INTEGER NOT NULL DEFAULT 0,
  "windowStartedAt" TIMESTAMPTZ(3) NOT NULL,
  "blockedUntil" TIMESTAMPTZ(3),
  "updatedAt" TIMESTAMPTZ(3) NOT NULL,
  CONSTRAINT "checkout_throttles_pkey" PRIMARY KEY ("keyHash")
);

CREATE INDEX "checkout_throttles_blockedUntil_idx"
  ON "checkout_throttles"("blockedUntil");
