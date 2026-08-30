CREATE TYPE "CheckoutIntentStatus" AS ENUM ('DRAFT', 'MATCHING', 'DRIVER_SELECTED', 'SUBMITTED', 'EXPIRED');

ALTER TABLE "orders"
  ADD COLUMN "checkoutIntentId" UUID,
  ADD COLUMN "courierProfileIdSnapshot" VARCHAR(64),
  ADD COLUMN "courierNameSnapshot" VARCHAR(80),
  ADD COLUMN "courierDistanceMeters" INTEGER,
  ADD COLUMN "courierDurationSeconds" INTEGER;

CREATE TABLE "checkout_intents" (
  "id" UUID NOT NULL,
  "publicId" VARCHAR(64) NOT NULL,
  "guestSessionId" UUID NOT NULL,
  "idempotencyKey" UUID NOT NULL,
  "status" "CheckoutIntentStatus" NOT NULL DEFAULT 'DRAFT',
  "customerName" VARCHAR(120) NOT NULL,
  "customerEmail" VARCHAR(320) NOT NULL,
  "fulfillmentType" "FulfillmentType" NOT NULL,
  "paymentMethod" "PaymentMethod" NOT NULL,
  "rechargeProvider" VARCHAR(40),
  "cartLines" JSONB NOT NULL,
  "currency" "Currency" NOT NULL,
  "subtotalMinor" BIGINT NOT NULL,
  "deliveryAddress" TEXT,
  "deliveryPostalCode" VARCHAR(32),
  "deliveryLocality" VARCHAR(120),
  "deliveryCountryCode" CHAR(2),
  "destinationLatitude" DECIMAL(10,7),
  "destinationLongitude" DECIMAL(10,7),
  "destinationMapboxPlaceId" VARCHAR(255),
  "candidateSet" JSONB,
  "selectedCourierProfileId" VARCHAR(64),
  "selectedCourierName" VARCHAR(80),
  "selectedDistanceMeters" INTEGER,
  "selectedDurationSeconds" INTEGER,
  "expiresAt" TIMESTAMPTZ(3) NOT NULL,
  "submittedAt" TIMESTAMPTZ(3),
  "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMPTZ(3) NOT NULL,
  CONSTRAINT "checkout_intents_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "checkout_intents_publicId_key" ON "checkout_intents"("publicId");
CREATE UNIQUE INDEX "checkout_intents_idempotencyKey_key" ON "checkout_intents"("idempotencyKey");
CREATE INDEX "checkout_intents_guestSessionId_createdAt_idx" ON "checkout_intents"("guestSessionId", "createdAt");
CREATE INDEX "checkout_intents_status_expiresAt_idx" ON "checkout_intents"("status", "expiresAt");
CREATE UNIQUE INDEX "orders_checkoutIntentId_key" ON "orders"("checkoutIntentId");

ALTER TABLE "checkout_intents"
  ADD CONSTRAINT "checkout_intents_guestSessionId_fkey"
  FOREIGN KEY ("guestSessionId") REFERENCES "guest_sessions"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "orders"
  ADD CONSTRAINT "orders_checkoutIntentId_fkey"
  FOREIGN KEY ("checkoutIntentId") REFERENCES "checkout_intents"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "checkout_intents"
  ADD CONSTRAINT "checkout_intents_selected_metrics_check"
  CHECK (
    ("selectedDistanceMeters" IS NULL OR "selectedDistanceMeters" >= 0)
    AND ("selectedDurationSeconds" IS NULL OR "selectedDurationSeconds" >= 0)
  );
