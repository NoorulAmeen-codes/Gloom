CREATE TABLE "goal_categories" (
  "id" serial PRIMARY KEY NOT NULL,
  "user_id" integer NOT NULL,
  "name" text NOT NULL,
  "icon" text DEFAULT '🎯',
  "created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint

CREATE TABLE "goals" (
  "id" serial PRIMARY KEY NOT NULL,
  "category_id" integer NOT NULL,
  "title" text NOT NULL,
  "description" text DEFAULT '',
  "is_achieved" boolean DEFAULT false NOT NULL,
  "achieved_at" timestamp,
  "created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint

ALTER TABLE "goal_categories"
ADD CONSTRAINT "goal_categories_user_id_users_id_fk"
FOREIGN KEY ("user_id")
REFERENCES "public"."users"("id")
ON DELETE cascade
ON UPDATE no action;
--> statement-breakpoint

ALTER TABLE "goals"
ADD CONSTRAINT "goals_category_id_goal_categories_id_fk"
FOREIGN KEY ("category_id")
REFERENCES "public"."goal_categories"("id")
ON DELETE cascade
ON UPDATE no action;
--> statement-breakpoint

CREATE INDEX "goal_categories_user_idx"
ON "goal_categories" USING btree ("user_id");
--> statement-breakpoint

CREATE INDEX "goals_category_idx"
ON "goals" USING btree ("category_id");