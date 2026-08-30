CREATE TYPE "CategoryDisplayTone" AS ENUM (
  'LIGHT',
  'MIST',
  'STONE',
  'CHARCOAL',
  'INK'
);

ALTER TABLE "categories"
  ADD COLUMN "displayTone" "CategoryDisplayTone" NOT NULL DEFAULT 'MIST';
