CREATE TYPE "UserRole" AS ENUM ('USER', 'ADMIN');
CREATE TYPE "DiveSiteSource" AS ENUM ('OSM', 'COMMUNITY');
CREATE TYPE "SiteAuditAction" AS ENUM ('SITE_CREATED', 'DESCRIPTION_UPDATED', 'SITE_UPDATED', 'SITE_MERGED', 'SITE_DELETED');

ALTER TABLE "users"
ADD COLUMN "role" "UserRole" NOT NULL DEFAULT 'USER';

UPDATE "users"
SET "role" = 'ADMIN'
WHERE "username_key" = 'mirasio' OR LOWER("username") = 'mirasio';

CREATE TABLE "dive_sites" (
  "id" UUID NOT NULL,
  "name" VARCHAR(160) NOT NULL,
  "normalized_name" VARCHAR(180) NOT NULL,
  "latitude" DOUBLE PRECISION NOT NULL,
  "longitude" DOUBLE PRECISION NOT NULL,
  "description" TEXT,
  "source_description" TEXT,
  "source" "DiveSiteSource" NOT NULL DEFAULT 'COMMUNITY',
  "external_id" VARCHAR(100),
  "source_url" VARCHAR(500),
  "metadata" JSONB,
  "created_by_id" UUID,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "dive_sites_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "dive_sites_latitude_valid" CHECK ("latitude" BETWEEN -90 AND 90),
  CONSTRAINT "dive_sites_longitude_valid" CHECK ("longitude" BETWEEN -180 AND 180)
);

CREATE TABLE "site_change_logs" (
  "id" UUID NOT NULL,
  "site_id" UUID,
  "actor_id" UUID,
  "action" "SiteAuditAction" NOT NULL,
  "before" JSONB,
  "after" JSONB,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "site_change_logs_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "site_reviews" ADD COLUMN "site_id" UUID;

CREATE UNIQUE INDEX "dive_sites_external_id_key" ON "dive_sites"("external_id");
CREATE INDEX "dive_sites_normalized_name_idx" ON "dive_sites"("normalized_name");
CREATE INDEX "dive_sites_latitude_longitude_idx" ON "dive_sites"("latitude", "longitude");
CREATE INDEX "site_reviews_site_id_created_at_idx" ON "site_reviews"("site_id", "created_at");
CREATE INDEX "site_change_logs_site_id_created_at_idx" ON "site_change_logs"("site_id", "created_at");
CREATE INDEX "site_change_logs_actor_id_created_at_idx" ON "site_change_logs"("actor_id", "created_at");

ALTER TABLE "dive_sites" ADD CONSTRAINT "dive_sites_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "site_reviews" ADD CONSTRAINT "site_reviews_site_id_fkey" FOREIGN KEY ("site_id") REFERENCES "dive_sites"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "site_change_logs" ADD CONSTRAINT "site_change_logs_site_id_fkey" FOREIGN KEY ("site_id") REFERENCES "dive_sites"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "site_change_logs" ADD CONSTRAINT "site_change_logs_actor_id_fkey" FOREIGN KEY ("actor_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
