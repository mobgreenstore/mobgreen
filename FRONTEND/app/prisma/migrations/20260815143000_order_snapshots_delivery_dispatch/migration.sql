ALTER TABLE "order_items"
  ADD COLUMN "productImageUrlSnapshot" TEXT,
  ADD COLUMN "productImageAltTextSnapshot" VARCHAR(255),
  ADD COLUMN "productImagePublicIdSnapshot" VARCHAR(255);

ALTER TABLE "orders"
  ADD COLUMN "deliveryPostalCode" VARCHAR(32),
  ADD COLUMN "deliveryCountryCode" CHAR(2),
  ADD COLUMN "destinationLatitude" DECIMAL(10,7),
  ADD COLUMN "destinationLongitude" DECIMAL(10,7),
  ADD COLUMN "destinationMapboxPlaceId" VARCHAR(255);

ALTER TABLE "store_settings"
  ADD COLUMN "dispatchAddress" TEXT,
  ADD COLUMN "dispatchLatitude" DECIMAL(10,7),
  ADD COLUMN "dispatchLongitude" DECIMAL(10,7),
  ADD COLUMN "dispatchMapboxPlaceId" VARCHAR(255);
