CREATE TABLE "users" (
    "id" UUID NOT NULL,
    "public_id" TEXT NOT NULL,
    "first_name" TEXT NOT NULL,
    "last_name" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "username_key" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "email_key" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "locale" TEXT NOT NULL DEFAULT 'en',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "users_public_id_key" ON "users"("public_id");
CREATE UNIQUE INDEX "users_username_key_key" ON "users"("username_key");
CREATE UNIQUE INDEX "users_email_key_key" ON "users"("email_key");
