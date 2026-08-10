ALTER TABLE "dives"
ADD COLUMN "group_count" INTEGER NOT NULL DEFAULT 1;

ALTER TABLE "dives"
ADD CONSTRAINT "dives_group_count_valid" CHECK ("group_count" BETWEEN 1 AND 100);

ALTER TABLE "planned_dives"
ADD COLUMN "planned_until" TIMESTAMP(3);

UPDATE "planned_dives"
SET "planned_until" = "planned_for";

ALTER TABLE "planned_dives"
ALTER COLUMN "planned_until" SET NOT NULL;

ALTER TABLE "planned_dives"
ADD CONSTRAINT "planned_dives_date_range_valid" CHECK ("planned_until" >= "planned_for");
