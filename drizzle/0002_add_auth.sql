-- Add authentication fields without modifying existing user data.
ALTER TABLE "users"
ADD COLUMN IF NOT EXISTS "email" text;

ALTER TABLE "users"
ADD COLUMN IF NOT EXISTS "password_hash" text;

-- Prevent duplicate login emails.
CREATE UNIQUE INDEX IF NOT EXISTS "users_email_unique_idx"
ON "users" ("email");