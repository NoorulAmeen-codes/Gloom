-- Additive migration only. It does not alter or remove any existing table or data.
CREATE TABLE IF NOT EXISTS "expenses" (
  "id" serial PRIMARY KEY NOT NULL,
  "user_id" integer NOT NULL REFERENCES "users"("id") ON DELETE cascade,
  "amount" numeric(12, 2) NOT NULL,
  "category" text NOT NULL,
  "description" text,
  "payment_method" text NOT NULL,
  "expense_date" text NOT NULL,
  "expense_time" text NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "expenses_user_date_idx" ON "expenses" ("user_id", "expense_date");
