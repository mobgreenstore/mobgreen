CREATE TABLE "order_payment_status_events" (
  "id" UUID NOT NULL,
  "orderId" UUID NOT NULL,
  "fromStatus" "PaymentStatus",
  "toStatus" "PaymentStatus" NOT NULL,
  "note" VARCHAR(1000),
  "changedByAdminId" UUID,
  "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "order_payment_status_events_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "order_payment_status_events_orderId_createdAt_idx"
  ON "order_payment_status_events"("orderId", "createdAt");
CREATE INDEX "order_payment_status_events_changedByAdminId_idx"
  ON "order_payment_status_events"("changedByAdminId");

ALTER TABLE "order_payment_status_events"
  ADD CONSTRAINT "order_payment_status_events_orderId_fkey"
  FOREIGN KEY ("orderId") REFERENCES "orders"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "order_payment_status_events"
  ADD CONSTRAINT "order_payment_status_events_changedByAdminId_fkey"
  FOREIGN KEY ("changedByAdminId") REFERENCES "admin_users"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;
