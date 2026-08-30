-- CreateEnum
CREATE TYPE "DeliveryTrackingState" AS ENUM ('ACTIVE', 'PAUSED', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "DeliveryRouteKind" AS ENUM ('DRIVING', 'DIRECT_FALLBACK');

-- CreateTable
CREATE TABLE "delivery_tracking" (
    "id" UUID NOT NULL,
    "orderId" UUID NOT NULL,
    "originLatitude" DECIMAL(10,7) NOT NULL,
    "originLongitude" DECIMAL(10,7) NOT NULL,
    "destinationLatitude" DECIMAL(10,7) NOT NULL,
    "destinationLongitude" DECIMAL(10,7) NOT NULL,
    "routeGeometry" JSONB NOT NULL,
    "routeDistanceMeters" INTEGER NOT NULL,
    "estimatedDurationSeconds" INTEGER NOT NULL,
    "dispatchedAt" TIMESTAMPTZ(3) NOT NULL,
    "estimatedArrivalAt" TIMESTAMPTZ(3) NOT NULL,
    "routeProviderId" VARCHAR(120) NOT NULL,
    "routeKind" "DeliveryRouteKind" NOT NULL,
    "state" "DeliveryTrackingState" NOT NULL DEFAULT 'ACTIVE',
    "lastProviderError" VARCHAR(255),
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "delivery_tracking_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "delivery_tracking_orderId_key" ON "delivery_tracking"("orderId");
CREATE INDEX "delivery_tracking_state_dispatchedAt_idx" ON "delivery_tracking"("state", "dispatchedAt");
CREATE INDEX "delivery_tracking_estimatedArrivalAt_idx" ON "delivery_tracking"("estimatedArrivalAt");

ALTER TABLE "delivery_tracking"
ADD CONSTRAINT "delivery_tracking_orderId_fkey"
FOREIGN KEY ("orderId") REFERENCES "orders"("id")
ON DELETE CASCADE ON UPDATE CASCADE;
