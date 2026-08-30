CREATE TYPE "OrderNotificationStatus" AS ENUM ('PENDING', 'PROCESSING', 'SENT', 'FAILED');
CREATE TYPE "OrderNotificationKind" AS ENUM ('ADMIN_ORDER_SUBMITTED');

CREATE TABLE "order_notifications" (
    "id" UUID NOT NULL,
    "orderId" UUID NOT NULL,
    "kind" "OrderNotificationKind" NOT NULL,
    "recipient" VARCHAR(320) NOT NULL,
    "sender" VARCHAR(320) NOT NULL,
    "status" "OrderNotificationStatus" NOT NULL DEFAULT 'PENDING',
    "attemptCount" INTEGER NOT NULL DEFAULT 0,
    "providerMessageId" VARCHAR(255),
    "lastError" VARCHAR(500),
    "lastAttemptAt" TIMESTAMPTZ(3),
    "sentAt" TIMESTAMPTZ(3),
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "order_notifications_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "order_verification_access_events" (
    "id" UUID NOT NULL,
    "orderId" UUID NOT NULL,
    "adminUserId" UUID NOT NULL,
    "occurredAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "order_verification_access_events_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "order_notifications_orderId_kind_recipient_key"
ON "order_notifications"("orderId", "kind", "recipient");

CREATE INDEX "order_notifications_status_createdAt_idx"
ON "order_notifications"("status", "createdAt");

CREATE INDEX "order_notifications_orderId_createdAt_idx"
ON "order_notifications"("orderId", "createdAt");

CREATE INDEX "order_verification_access_events_orderId_occurredAt_idx"
ON "order_verification_access_events"("orderId", "occurredAt");

CREATE INDEX "order_verification_access_events_adminUserId_occurredAt_idx"
ON "order_verification_access_events"("adminUserId", "occurredAt");

ALTER TABLE "order_notifications"
ADD CONSTRAINT "order_notifications_orderId_fkey"
FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "order_verification_access_events"
ADD CONSTRAINT "order_verification_access_events_orderId_fkey"
FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "order_verification_access_events"
ADD CONSTRAINT "order_verification_access_events_adminUserId_fkey"
FOREIGN KEY ("adminUserId") REFERENCES "admin_users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
