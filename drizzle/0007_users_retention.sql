ALTER TABLE "users" ADD COLUMN "last_active_at" timestamp with time zone DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "inactivity_notice_at" timestamp with time zone;--> statement-breakpoint
CREATE INDEX "users_last_active_idx" ON "users" USING btree ("last_active_at");--> statement-breakpoint
-- Comptes existants : dernière activité connue, la plus récente entre la création du compte et ses sessions
-- (une session est créée à la connexion et prolongée à l'usage). Sans cela, tous partiraient d'aujourd'hui.
UPDATE "users" u SET "last_active_at" = GREATEST(
  u."created_at",
  COALESCE((SELECT max(s."updated_at") FROM "sessions" s WHERE s."user_id" = u."id"), u."created_at")
);
