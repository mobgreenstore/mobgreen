CREATE TYPE "SpecialOfferStatus" AS ENUM ('DRAFT', 'ACTIVE', 'EXPIRED', 'CANCELLED');

ALTER TABLE "product_price_options"
  ADD COLUMN "costMinor" BIGINT;

ALTER TABLE "order_items"
  ADD COLUMN "specialOfferId" UUID,
  ADD COLUMN "offerOriginalTotalMinorSnapshot" BIGINT,
  ADD COLUMN "offerDiscountBpsSnapshot" INTEGER,
  ADD COLUMN "offerDiscountMinorSnapshot" BIGINT,
  ADD COLUMN "offerTotalMinorSnapshot" BIGINT,
  ADD COLUMN "offerBundleQuantitySnapshot" INTEGER,
  ADD COLUMN "offerEndsAtSnapshot" TIMESTAMPTZ(3);

CREATE TABLE "category_offer_policies" (
  "id" UUID NOT NULL,
  "categoryId" UUID NOT NULL,
  "enabled" BOOLEAN NOT NULL DEFAULT false,
  "minimumWeightGrams" INTEGER NOT NULL DEFAULT 80,
  "maximumWeightGrams" INTEGER NOT NULL DEFAULT 1000,
  "minimumDiscountBps" INTEGER NOT NULL DEFAULT 300,
  "maximumDiscountBps" INTEGER NOT NULL DEFAULT 1500,
  "minimumMarginBps" INTEGER NOT NULL DEFAULT 1500,
  "durationMinutes" INTEGER NOT NULL DEFAULT 1440,
  "maxOffersPerPriceOption" INTEGER NOT NULL DEFAULT 4,
  "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMPTZ(3) NOT NULL,
  CONSTRAINT "category_offer_policies_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "special_offers" (
  "id" UUID NOT NULL,
  "publicId" VARCHAR(64) NOT NULL,
  "generationKey" UUID NOT NULL,
  "categoryId" UUID NOT NULL,
  "productId" UUID NOT NULL,
  "priceOptionId" UUID NOT NULL,
  "currency" "Currency" NOT NULL,
  "bundleQuantity" INTEGER NOT NULL,
  "totalWeightGrams" DECIMAL(12,3) NOT NULL,
  "originalTotalMinor" BIGINT NOT NULL,
  "discountBps" INTEGER NOT NULL,
  "discountMinor" BIGINT NOT NULL,
  "offerTotalMinor" BIGINT NOT NULL,
  "status" "SpecialOfferStatus" NOT NULL DEFAULT 'DRAFT',
  "startsAt" TIMESTAMPTZ(3) NOT NULL,
  "endsAt" TIMESTAMPTZ(3) NOT NULL,
  "archivedAt" TIMESTAMPTZ(3),
  "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMPTZ(3) NOT NULL,
  CONSTRAINT "special_offers_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "category_offer_policies_categoryId_key"
  ON "category_offer_policies"("categoryId");
CREATE INDEX "category_offer_policies_enabled_idx"
  ON "category_offer_policies"("enabled");

CREATE UNIQUE INDEX "special_offers_publicId_key"
  ON "special_offers"("publicId");
CREATE UNIQUE INDEX "special_offers_generationKey_priceOptionId_bundleQuantity_key"
  ON "special_offers"("generationKey", "priceOptionId", "bundleQuantity");
CREATE INDEX "special_offers_categoryId_status_endsAt_idx"
  ON "special_offers"("categoryId", "status", "endsAt");
CREATE INDEX "special_offers_productId_status_endsAt_idx"
  ON "special_offers"("productId", "status", "endsAt");
CREATE INDEX "special_offers_priceOptionId_idx"
  ON "special_offers"("priceOptionId");
CREATE INDEX "special_offers_generationKey_idx"
  ON "special_offers"("generationKey");
CREATE INDEX "special_offers_endsAt_idx"
  ON "special_offers"("endsAt");
CREATE INDEX "order_items_specialOfferId_idx"
  ON "order_items"("specialOfferId");

ALTER TABLE "category_offer_policies"
  ADD CONSTRAINT "category_offer_policies_categoryId_fkey"
  FOREIGN KEY ("categoryId") REFERENCES "categories"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "special_offers"
  ADD CONSTRAINT "special_offers_categoryId_fkey"
  FOREIGN KEY ("categoryId") REFERENCES "categories"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT "special_offers_productId_fkey"
  FOREIGN KEY ("productId") REFERENCES "products"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT "special_offers_priceOptionId_fkey"
  FOREIGN KEY ("priceOptionId") REFERENCES "product_price_options"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "order_items"
  ADD CONSTRAINT "order_items_specialOfferId_fkey"
  FOREIGN KEY ("specialOfferId") REFERENCES "special_offers"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "product_price_options"
  ADD CONSTRAINT "product_price_options_cost_check"
  CHECK (
    "costMinor" IS NULL
    OR ("costMinor" > 0 AND "costMinor" < "priceMinor")
  );

ALTER TABLE "category_offer_policies"
  ADD CONSTRAINT "category_offer_policies_weight_check"
  CHECK (
    "minimumWeightGrams" >= 80
    AND "maximumWeightGrams" > "minimumWeightGrams"
    AND "maximumWeightGrams" <= 100000
  ),
  ADD CONSTRAINT "category_offer_policies_discount_check"
  CHECK (
    "minimumDiscountBps" >= 1
    AND "maximumDiscountBps" >= "minimumDiscountBps"
    AND "maximumDiscountBps" <= 1500
  ),
  ADD CONSTRAINT "category_offer_policies_margin_check"
  CHECK ("minimumMarginBps" BETWEEN 0 AND 10000),
  ADD CONSTRAINT "category_offer_policies_duration_check"
  CHECK ("durationMinutes" BETWEEN 60 AND 1440),
  ADD CONSTRAINT "category_offer_policies_offer_count_check"
  CHECK ("maxOffersPerPriceOption" BETWEEN 1 AND 4);

ALTER TABLE "special_offers"
  ADD CONSTRAINT "special_offers_value_check"
  CHECK (
    "bundleQuantity" > 0
    AND "totalWeightGrams" >= 80
    AND "originalTotalMinor" > 0
    AND "discountBps" BETWEEN 1 AND 1500
    AND "discountMinor" > 0
    AND "discountMinor" < "originalTotalMinor"
    AND "offerTotalMinor" = "originalTotalMinor" - "discountMinor"
  ),
  ADD CONSTRAINT "special_offers_duration_check"
  CHECK (
    "endsAt" > "startsAt"
    AND "endsAt" <= "startsAt" + INTERVAL '24 hours'
  );

ALTER TABLE "order_items"
  ADD CONSTRAINT "order_items_offer_snapshot_check"
  CHECK (
    (
      "offerDiscountBpsSnapshot" IS NULL
      OR "offerDiscountBpsSnapshot" BETWEEN 1 AND 1500
    )
    AND (
      "offerBundleQuantitySnapshot" IS NULL
      OR "offerBundleQuantitySnapshot" > 0
    )
    AND (
      "offerOriginalTotalMinorSnapshot" IS NULL
      OR "offerOriginalTotalMinorSnapshot" > 0
    )
    AND (
      "offerDiscountMinorSnapshot" IS NULL
      OR "offerDiscountMinorSnapshot" > 0
    )
    AND (
      "offerTotalMinorSnapshot" IS NULL
      OR "offerTotalMinorSnapshot" > 0
    )
  );
