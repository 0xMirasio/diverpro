ALTER TYPE "DiveSiteSource" ADD VALUE IF NOT EXISTS 'OPEN_DIVEMAP';

ALTER TABLE "dive_sites"
  ADD COLUMN "country_code" VARCHAR(2),
  ADD COLUMN "country_name" VARCHAR(120),
  ADD COLUMN "sea_name" VARCHAR(160),
  ADD COLUMN "environment" VARCHAR(40),
  ADD COLUMN "topologies" JSONB,
  ADD COLUMN "max_depth_m" DOUBLE PRECISION,
  ADD COLUMN "entry_type" VARCHAR(40);
