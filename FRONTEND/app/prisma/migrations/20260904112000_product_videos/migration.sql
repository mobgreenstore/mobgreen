CREATE TABLE "product_videos" (
  "id" UUID NOT NULL,
  "productId" UUID NOT NULL,
  "cloudinaryPublicId" VARCHAR(255) NOT NULL,
  "url" TEXT NOT NULL,
  "posterUrl" TEXT,
  "altText" VARCHAR(255) NOT NULL,
  "width" INTEGER NOT NULL,
  "height" INTEGER NOT NULL,
  "durationSeconds" INTEGER,
  "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMPTZ(3) NOT NULL,
  CONSTRAINT "product_videos_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "product_videos_productId_key" ON "product_videos"("productId");
CREATE UNIQUE INDEX "product_videos_cloudinaryPublicId_key" ON "product_videos"("cloudinaryPublicId");
CREATE INDEX "product_videos_productId_idx" ON "product_videos"("productId");

ALTER TABLE "product_videos"
  ADD CONSTRAINT "product_videos_productId_fkey"
  FOREIGN KEY ("productId") REFERENCES "products"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;
