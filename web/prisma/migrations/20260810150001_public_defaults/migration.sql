ALTER TABLE "users"
ALTER COLUMN "logbook_visibility" SET DEFAULT 'PUBLIC';

ALTER TABLE "dives"
ALTER COLUMN "visibility" SET DEFAULT 'PUBLIC';

ALTER TABLE "planned_dives"
ALTER COLUMN "visibility" SET DEFAULT 'PUBLIC';

UPDATE "users"
SET "email" = REPLACE("email", '@demo.diverpro.test', '@demo.bluemates.test'),
    "email_key" = REPLACE("email_key", '@demo.diverpro.test', '@demo.bluemates.test')
WHERE "email_key" IN (
  'gorge@demo.diverpro.test',
  'lucas@demo.diverpro.test',
  'michelle@demo.diverpro.test'
);
