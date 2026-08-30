-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "WeightUnit" AS ENUM ('G', 'KG');

-- CreateEnum
CREATE TYPE "Currency" AS ENUM ('GBP', 'EUR', 'USD');

-- CreateEnum
CREATE TYPE "ProductStatus" AS ENUM ('DRAFT', 'ACTIVE', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "OrderStatus" AS ENUM ('PENDING', 'CONFIRMED', 'PROCESSING', 'READY', 'OUT_FOR_DELIVERY', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('UNPAID', 'PENDING', 'PAID', 'REFUNDED');

-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('RECHARGE_FROM_STORE', 'RECHARGE_ONLINE');

-- CreateEnum
CREATE TYPE "FulfillmentType" AS ENUM ('PICKUP', 'DELIVERY');

-- CreateTable
CREATE TABLE "admin_users" (
    "id" UUID NOT NULL,
    "email" VARCHAR(320) NOT NULL,
    "passwordHash" VARCHAR(255) NOT NULL,
    "name" VARCHAR(120) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "admin_users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "categories" (
    "id" UUID NOT NULL,
    "name" VARCHAR(120) NOT NULL,
    "slug" VARCHAR(140) NOT NULL,
    "description" VARCHAR(500),
    "imagePublicId" VARCHAR(255),
    "imageUrl" TEXT,
    "imageAltText" VARCHAR(255),
    "imageWidth" INTEGER,
    "imageHeight" INTEGER,
    "position" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "archivedAt" TIMESTAMPTZ(3),
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "products" (
    "id" UUID NOT NULL,
    "categoryId" UUID NOT NULL,
    "name" VARCHAR(160) NOT NULL,
    "slug" VARCHAR(180) NOT NULL,
    "shortDescription" VARCHAR(280) NOT NULL,
    "description" TEXT,
    "status" "ProductStatus" NOT NULL DEFAULT 'DRAFT',
    "archivedAt" TIMESTAMPTZ(3),
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "products_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_images" (
    "id" UUID NOT NULL,
    "productId" UUID NOT NULL,
    "cloudinaryPublicId" VARCHAR(255) NOT NULL,
    "url" TEXT NOT NULL,
    "altText" VARCHAR(255) NOT NULL,
    "width" INTEGER NOT NULL,
    "height" INTEGER NOT NULL,
    "position" INTEGER NOT NULL DEFAULT 0,
    "isCover" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "product_images_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_price_options" (
    "id" UUID NOT NULL,
    "productId" UUID NOT NULL,
    "weightValue" DECIMAL(12,3) NOT NULL,
    "weightUnit" "WeightUnit" NOT NULL,
    "currency" "Currency" NOT NULL,
    "priceMinor" BIGINT NOT NULL,
    "compareAtPriceMinor" BIGINT,
    "position" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "archivedAt" TIMESTAMPTZ(3),
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "product_price_options_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "orders" (
    "id" UUID NOT NULL,
    "reference" VARCHAR(32) NOT NULL,
    "customerName" VARCHAR(120) NOT NULL,
    "customerPhone" VARCHAR(40) NOT NULL,
    "customerEmail" VARCHAR(320),
    "fulfillmentType" "FulfillmentType" NOT NULL,
    "deliveryAddress" TEXT,
    "customerNote" VARCHAR(1000),
    "currency" "Currency" NOT NULL,
    "subtotalMinor" BIGINT NOT NULL,
    "deliveryFeeMinor" BIGINT NOT NULL DEFAULT 0,
    "totalMinor" BIGINT NOT NULL,
    "status" "OrderStatus" NOT NULL DEFAULT 'PENDING',
    "paymentStatus" "PaymentStatus" NOT NULL DEFAULT 'UNPAID',
    "paymentMethod" "PaymentMethod" NOT NULL,
    "archivedAt" TIMESTAMPTZ(3),
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "order_items" (
    "id" UUID NOT NULL,
    "orderId" UUID NOT NULL,
    "productId" UUID,
    "priceOptionId" UUID,
    "productNameSnapshot" VARCHAR(160) NOT NULL,
    "weightValueSnapshot" DECIMAL(12,3) NOT NULL,
    "weightUnitSnapshot" "WeightUnit" NOT NULL,
    "currencySnapshot" "Currency" NOT NULL,
    "unitPriceMinor" BIGINT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "lineTotalMinor" BIGINT NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "order_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "order_status_events" (
    "id" UUID NOT NULL,
    "orderId" UUID NOT NULL,
    "fromStatus" "OrderStatus",
    "toStatus" "OrderStatus" NOT NULL,
    "note" VARCHAR(1000),
    "changedByAdminId" UUID,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "order_status_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "store_settings" (
    "id" VARCHAR(32) NOT NULL DEFAULT 'default',
    "storeName" VARCHAR(120) NOT NULL DEFAULT 'MOB GREENS',
    "supportPhone" VARCHAR(40),
    "supportedCurrencyCodes" "Currency"[] DEFAULT ARRAY['GBP', 'EUR', 'USD']::"Currency"[],
    "orderPrefix" VARCHAR(10) NOT NULL DEFAULT 'MG',
    "pickupInstructions" TEXT,
    "deliveryEnabled" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "store_settings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "admin_users_email_key" ON "admin_users"("email");

-- CreateIndex
CREATE INDEX "admin_users_isActive_idx" ON "admin_users"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "categories_slug_key" ON "categories"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "categories_imagePublicId_key" ON "categories"("imagePublicId");

-- CreateIndex
CREATE INDEX "categories_isActive_position_idx" ON "categories"("isActive", "position");

-- CreateIndex
CREATE INDEX "categories_archivedAt_idx" ON "categories"("archivedAt");

-- CreateIndex
CREATE UNIQUE INDEX "products_slug_key" ON "products"("slug");

-- CreateIndex
CREATE INDEX "products_categoryId_status_idx" ON "products"("categoryId", "status");

-- CreateIndex
CREATE INDEX "products_status_createdAt_idx" ON "products"("status", "createdAt");

-- CreateIndex
CREATE INDEX "products_archivedAt_idx" ON "products"("archivedAt");

-- CreateIndex
CREATE UNIQUE INDEX "product_images_cloudinaryPublicId_key" ON "product_images"("cloudinaryPublicId");

-- CreateIndex
CREATE INDEX "product_images_productId_isCover_idx" ON "product_images"("productId", "isCover");

-- CreateIndex
CREATE UNIQUE INDEX "product_images_productId_position_key" ON "product_images"("productId", "position");

-- CreateIndex
CREATE INDEX "product_price_options_productId_isActive_position_idx" ON "product_price_options"("productId", "isActive", "position");

-- CreateIndex
CREATE INDEX "product_price_options_archivedAt_idx" ON "product_price_options"("archivedAt");

-- CreateIndex
CREATE UNIQUE INDEX "product_price_options_productId_weightValue_weightUnit_curr_key" ON "product_price_options"("productId", "weightValue", "weightUnit", "currency");

-- CreateIndex
CREATE UNIQUE INDEX "orders_reference_key" ON "orders"("reference");

-- CreateIndex
CREATE INDEX "orders_status_createdAt_idx" ON "orders"("status", "createdAt");

-- CreateIndex
CREATE INDEX "orders_paymentStatus_createdAt_idx" ON "orders"("paymentStatus", "createdAt");

-- CreateIndex
CREATE INDEX "orders_fulfillmentType_createdAt_idx" ON "orders"("fulfillmentType", "createdAt");

-- CreateIndex
CREATE INDEX "orders_currency_createdAt_idx" ON "orders"("currency", "createdAt");

-- CreateIndex
CREATE INDEX "orders_customerPhone_idx" ON "orders"("customerPhone");

-- CreateIndex
CREATE INDEX "orders_archivedAt_idx" ON "orders"("archivedAt");

-- CreateIndex
CREATE INDEX "order_items_orderId_idx" ON "order_items"("orderId");

-- CreateIndex
CREATE INDEX "order_items_productId_idx" ON "order_items"("productId");

-- CreateIndex
CREATE INDEX "order_items_priceOptionId_idx" ON "order_items"("priceOptionId");

-- CreateIndex
CREATE INDEX "order_status_events_orderId_createdAt_idx" ON "order_status_events"("orderId", "createdAt");

-- CreateIndex
CREATE INDEX "order_status_events_changedByAdminId_idx" ON "order_status_events"("changedByAdminId");

-- AddForeignKey
ALTER TABLE "products" ADD CONSTRAINT "products_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_images" ADD CONSTRAINT "product_images_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_price_options" ADD CONSTRAINT "product_price_options_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_priceOptionId_fkey" FOREIGN KEY ("priceOptionId") REFERENCES "product_price_options"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_status_events" ADD CONSTRAINT "order_status_events_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_status_events" ADD CONSTRAINT "order_status_events_changedByAdminId_fkey" FOREIGN KEY ("changedByAdminId") REFERENCES "admin_users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Business integrity constraints not expressible in the Prisma schema.
ALTER TABLE "product_images"
  ADD CONSTRAINT "product_images_dimensions_positive" CHECK ("width" > 0 AND "height" > 0),
  ADD CONSTRAINT "product_images_position_nonnegative" CHECK ("position" >= 0);

CREATE UNIQUE INDEX "product_images_one_cover_per_product"
  ON "product_images" ("productId")
  WHERE "isCover" = true;

ALTER TABLE "product_price_options"
  ADD CONSTRAINT "product_price_options_weight_positive" CHECK ("weightValue" > 0),
  ADD CONSTRAINT "product_price_options_price_nonnegative" CHECK ("priceMinor" >= 0),
  ADD CONSTRAINT "product_price_options_compare_price_nonnegative" CHECK ("compareAtPriceMinor" IS NULL OR "compareAtPriceMinor" >= 0),
  ADD CONSTRAINT "product_price_options_position_nonnegative" CHECK ("position" >= 0);

ALTER TABLE "orders"
  ADD CONSTRAINT "orders_amounts_nonnegative" CHECK ("subtotalMinor" >= 0 AND "deliveryFeeMinor" >= 0 AND "totalMinor" >= 0),
  ADD CONSTRAINT "orders_total_consistent" CHECK ("totalMinor" = "subtotalMinor" + "deliveryFeeMinor"),
  ADD CONSTRAINT "orders_delivery_address_required" CHECK ("fulfillmentType" <> 'DELIVERY' OR "deliveryAddress" IS NOT NULL);

ALTER TABLE "order_items"
  ADD CONSTRAINT "order_items_weight_positive" CHECK ("weightValueSnapshot" > 0),
  ADD CONSTRAINT "order_items_quantity_positive" CHECK ("quantity" > 0),
  ADD CONSTRAINT "order_items_amounts_nonnegative" CHECK ("unitPriceMinor" >= 0 AND "lineTotalMinor" >= 0),
  ADD CONSTRAINT "order_items_total_consistent" CHECK ("lineTotalMinor" = "unitPriceMinor" * "quantity");
