CREATE TYPE "PaymentAttemptStatus" AS ENUM (
  'CREATED',
  'PENDING_REVIEW',
  'APPROVED',
  'REJECTED',
  'INVOICE_PENDING',
  'PAYMENT_DETECTED',
  'CONFIRMING',
  'SETTLED',
  'UNDERPAID',
  'OVERPAID',
  'EXPIRED',
  'FAILED',
  'CANCELLED'
);

CREATE TYPE "PaymentProvider" AS ENUM ('INTERNAL_RECHARGE', 'NOWPAYMENTS');

CREATE TABLE "payment_attempts" (
  "id" UUID NOT NULL,
  "publicId" VARCHAR(64) NOT NULL,
  "checkoutIntentId" UUID NOT NULL,
  "orderId" UUID,
  "paymentMethod" "PaymentMethod" NOT NULL,
  "provider" "PaymentProvider" NOT NULL,
  "currency" "Currency" NOT NULL,
  "orderTotalMinor" BIGINT NOT NULL,
  "depositMinor" BIGINT NOT NULL,
  "cashBalanceDueMinor" BIGINT NOT NULL,
  "expectedSatoshis" BIGINT,
  "receivedSatoshis" BIGINT NOT NULL DEFAULT 0,
  "lockedExchangeRate" DECIMAL(24,8),
  "providerInvoiceId" VARCHAR(255),
  "paymentAddress" VARCHAR(255),
  "transactionId" VARCHAR(255),
  "confirmationCount" INTEGER NOT NULL DEFAULT 0,
  "status" "PaymentAttemptStatus" NOT NULL DEFAULT 'CREATED',
  "expiresAt" TIMESTAMPTZ(3),
  "detectedAt" TIMESTAMPTZ(3),
  "confirmedAt" TIMESTAMPTZ(3),
  "failedAt" TIMESTAMPTZ(3),
  "cancelledAt" TIMESTAMPTZ(3),
  "cashCollectedAt" TIMESTAMPTZ(3),
  "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMPTZ(3) NOT NULL,
  CONSTRAINT "payment_attempts_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "recharge_payment_codes" (
  "id" UUID NOT NULL,
  "paymentAttemptId" UUID NOT NULL,
  "encryptedValue" TEXT NOT NULL,
  "maskedValue" VARCHAR(96) NOT NULL,
  "fingerprint" VARCHAR(64) NOT NULL,
  "position" INTEGER NOT NULL,
  "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "recharge_payment_codes_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "payment_events" (
  "id" UUID NOT NULL,
  "paymentAttemptId" UUID NOT NULL,
  "providerEventId" VARCHAR(255),
  "eventType" VARCHAR(80) NOT NULL,
  "fromStatus" "PaymentAttemptStatus",
  "toStatus" "PaymentAttemptStatus" NOT NULL,
  "payloadHash" VARCHAR(64),
  "metadata" JSONB,
  "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "payment_events_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "payment_attempts_publicId_key" ON "payment_attempts"("publicId");
CREATE UNIQUE INDEX "payment_attempts_providerInvoiceId_key" ON "payment_attempts"("providerInvoiceId");
CREATE INDEX "payment_attempts_checkoutIntentId_createdAt_idx" ON "payment_attempts"("checkoutIntentId", "createdAt");
CREATE INDEX "payment_attempts_orderId_createdAt_idx" ON "payment_attempts"("orderId", "createdAt");
CREATE INDEX "payment_attempts_status_expiresAt_idx" ON "payment_attempts"("status", "expiresAt");
CREATE UNIQUE INDEX "recharge_payment_codes_paymentAttemptId_position_key" ON "recharge_payment_codes"("paymentAttemptId", "position");
CREATE UNIQUE INDEX "recharge_payment_codes_paymentAttemptId_fingerprint_key" ON "recharge_payment_codes"("paymentAttemptId", "fingerprint");
CREATE INDEX "recharge_payment_codes_paymentAttemptId_idx" ON "recharge_payment_codes"("paymentAttemptId");
CREATE UNIQUE INDEX "payment_events_providerEventId_key" ON "payment_events"("providerEventId");
CREATE INDEX "payment_events_paymentAttemptId_createdAt_idx" ON "payment_events"("paymentAttemptId", "createdAt");

ALTER TABLE "payment_attempts"
  ADD CONSTRAINT "payment_attempts_checkoutIntentId_fkey"
  FOREIGN KEY ("checkoutIntentId") REFERENCES "checkout_intents"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "payment_attempts"
  ADD CONSTRAINT "payment_attempts_orderId_fkey"
  FOREIGN KEY ("orderId") REFERENCES "orders"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "recharge_payment_codes"
  ADD CONSTRAINT "recharge_payment_codes_paymentAttemptId_fkey"
  FOREIGN KEY ("paymentAttemptId") REFERENCES "payment_attempts"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "payment_events"
  ADD CONSTRAINT "payment_events_paymentAttemptId_fkey"
  FOREIGN KEY ("paymentAttemptId") REFERENCES "payment_attempts"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;
