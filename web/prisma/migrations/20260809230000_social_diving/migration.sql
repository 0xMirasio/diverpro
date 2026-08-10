CREATE TYPE "Visibility" AS ENUM ('PUBLIC', 'PRIVATE');
CREATE TYPE "FriendshipStatus" AS ENUM ('PENDING', 'ACCEPTED', 'DECLINED');
CREATE TYPE "MediaKind" AS ENUM ('AVATAR', 'DIVE', 'REVIEW');

ALTER TABLE "users"
ADD COLUMN "birth_date" DATE,
ADD COLUMN "bio" VARCHAR(500),
ADD COLUMN "avatar_url" TEXT,
ADD COLUMN "profile_visibility" "Visibility" NOT NULL DEFAULT 'PUBLIC',
ADD COLUMN "logbook_visibility" "Visibility" NOT NULL DEFAULT 'PRIVATE';

CREATE TABLE "friendships" (
  "id" UUID NOT NULL,
  "requester_id" UUID NOT NULL,
  "recipient_id" UUID NOT NULL,
  "status" "FriendshipStatus" NOT NULL DEFAULT 'PENDING',
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "friendships_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "friendships_not_self" CHECK ("requester_id" <> "recipient_id")
);

CREATE TABLE "dives" (
  "id" UUID NOT NULL,
  "user_id" UUID NOT NULL,
  "date" DATE NOT NULL,
  "site_name" VARCHAR(160) NOT NULL,
  "depth_m" DOUBLE PRECISION NOT NULL,
  "duration_minutes" INTEGER NOT NULL,
  "details" TEXT,
  "latitude" DOUBLE PRECISION,
  "longitude" DOUBLE PRECISION,
  "visibility" "Visibility" NOT NULL DEFAULT 'PRIVATE',
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "dives_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "dives_depth_valid" CHECK ("depth_m" > 0 AND "depth_m" <= 350),
  CONSTRAINT "dives_duration_valid" CHECK ("duration_minutes" > 0 AND "duration_minutes" <= 1440),
  CONSTRAINT "dives_coordinates_valid" CHECK (("latitude" IS NULL AND "longitude" IS NULL) OR ("latitude" BETWEEN -90 AND 90 AND "longitude" BETWEEN -180 AND 180))
);

CREATE TABLE "planned_dives" (
  "id" UUID NOT NULL,
  "user_id" UUID NOT NULL,
  "planned_for" TIMESTAMP(3) NOT NULL,
  "site_name" VARCHAR(160) NOT NULL,
  "details" TEXT,
  "latitude" DOUBLE PRECISION,
  "longitude" DOUBLE PRECISION,
  "visibility" "Visibility" NOT NULL DEFAULT 'PRIVATE',
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "planned_dives_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "planned_dives_coordinates_valid" CHECK (("latitude" IS NULL AND "longitude" IS NULL) OR ("latitude" BETWEEN -90 AND 90 AND "longitude" BETWEEN -180 AND 180))
);

CREATE TABLE "site_reviews" (
  "id" UUID NOT NULL,
  "user_id" UUID NOT NULL,
  "site_name" VARCHAR(160) NOT NULL,
  "latitude" DOUBLE PRECISION NOT NULL,
  "longitude" DOUBLE PRECISION NOT NULL,
  "rating" INTEGER NOT NULL,
  "comment" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "site_reviews_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "site_reviews_rating_valid" CHECK ("rating" BETWEEN 1 AND 5),
  CONSTRAINT "site_reviews_coordinates_valid" CHECK ("latitude" BETWEEN -90 AND 90 AND "longitude" BETWEEN -180 AND 180)
);

CREATE TABLE "media" (
  "id" UUID NOT NULL,
  "owner_id" UUID NOT NULL,
  "storage_key" TEXT NOT NULL,
  "mime_type" VARCHAR(80) NOT NULL,
  "byte_size" INTEGER NOT NULL,
  "kind" "MediaKind" NOT NULL,
  "dive_id" UUID,
  "review_id" UUID,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "media_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "friendships_requester_id_recipient_id_key" ON "friendships"("requester_id", "recipient_id");
CREATE UNIQUE INDEX "friendships_canonical_pair_key" ON "friendships"(LEAST("requester_id", "recipient_id"), GREATEST("requester_id", "recipient_id"));
CREATE INDEX "friendships_recipient_id_status_idx" ON "friendships"("recipient_id", "status");
CREATE INDEX "friendships_requester_id_status_idx" ON "friendships"("requester_id", "status");
CREATE INDEX "dives_user_id_date_idx" ON "dives"("user_id", "date");
CREATE INDEX "dives_visibility_idx" ON "dives"("visibility");
CREATE INDEX "planned_dives_user_id_planned_for_idx" ON "planned_dives"("user_id", "planned_for");
CREATE INDEX "planned_dives_visibility_planned_for_idx" ON "planned_dives"("visibility", "planned_for");
CREATE INDEX "site_reviews_latitude_longitude_idx" ON "site_reviews"("latitude", "longitude");
CREATE INDEX "site_reviews_user_id_created_at_idx" ON "site_reviews"("user_id", "created_at");
CREATE UNIQUE INDEX "media_storage_key_key" ON "media"("storage_key");
CREATE INDEX "media_owner_id_kind_idx" ON "media"("owner_id", "kind");
CREATE INDEX "media_dive_id_idx" ON "media"("dive_id");
CREATE INDEX "media_review_id_idx" ON "media"("review_id");

ALTER TABLE "friendships" ADD CONSTRAINT "friendships_requester_id_fkey" FOREIGN KEY ("requester_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "friendships" ADD CONSTRAINT "friendships_recipient_id_fkey" FOREIGN KEY ("recipient_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "dives" ADD CONSTRAINT "dives_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "planned_dives" ADD CONSTRAINT "planned_dives_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "site_reviews" ADD CONSTRAINT "site_reviews_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "media" ADD CONSTRAINT "media_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "media" ADD CONSTRAINT "media_dive_id_fkey" FOREIGN KEY ("dive_id") REFERENCES "dives"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "media" ADD CONSTRAINT "media_review_id_fkey" FOREIGN KEY ("review_id") REFERENCES "site_reviews"("id") ON DELETE CASCADE ON UPDATE CASCADE;
