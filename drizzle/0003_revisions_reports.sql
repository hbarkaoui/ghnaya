CREATE TYPE "public"."report_reason" AS ENUM('copyright', 'wrong_lyrics', 'duplicate', 'spam', 'other');--> statement-breakpoint
CREATE TYPE "public"."report_status" AS ENUM('open', 'resolved', 'dismissed');--> statement-breakpoint
CREATE TYPE "public"."revision_status" AS ENUM('pending', 'approved', 'rejected');--> statement-breakpoint
CREATE TABLE "reports" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"song_id" uuid NOT NULL,
	"reporter_id" uuid,
	"contact_email" text,
	"reason" "report_reason" NOT NULL,
	"details" text NOT NULL,
	"status" "report_status" DEFAULT 'open' NOT NULL,
	"resolution_note" text,
	"resolved_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "reports_resolution_ck" CHECK (("reports"."status" = 'open') = ("reports"."resolution_note" IS NULL))
);
--> statement-breakpoint
CREATE TABLE "song_revisions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"song_id" uuid,
	"author_id" uuid,
	"payload" jsonb NOT NULL,
	"rights_declared" boolean NOT NULL,
	"status" "revision_status" DEFAULT 'pending' NOT NULL,
	"reviewer_id" uuid,
	"review_note" text,
	"reviewed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "song_revisions_rights_ck" CHECK ("song_revisions"."rights_declared" = true),
	CONSTRAINT "song_revisions_reviewed_ck" CHECK (("song_revisions"."status" = 'pending') = ("song_revisions"."reviewed_at" IS NULL)),
	CONSTRAINT "song_revisions_reject_note_ck" CHECK ("song_revisions"."status" <> 'rejected' OR "song_revisions"."review_note" IS NOT NULL)
);
--> statement-breakpoint
ALTER TABLE "reports" ADD CONSTRAINT "reports_song_id_songs_id_fk" FOREIGN KEY ("song_id") REFERENCES "public"."songs"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reports" ADD CONSTRAINT "reports_reporter_id_users_id_fk" FOREIGN KEY ("reporter_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reports" ADD CONSTRAINT "reports_resolved_by_users_id_fk" FOREIGN KEY ("resolved_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "song_revisions" ADD CONSTRAINT "song_revisions_song_id_songs_id_fk" FOREIGN KEY ("song_id") REFERENCES "public"."songs"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "song_revisions" ADD CONSTRAINT "song_revisions_author_id_users_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "song_revisions" ADD CONSTRAINT "song_revisions_reviewer_id_users_id_fk" FOREIGN KEY ("reviewer_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "reports_queue_idx" ON "reports" USING btree ("status","created_at");--> statement-breakpoint
CREATE INDEX "reports_song_idx" ON "reports" USING btree ("song_id");--> statement-breakpoint
CREATE UNIQUE INDEX "song_revisions_pending_uq" ON "song_revisions" USING btree ("author_id","song_id") WHERE status = 'pending';--> statement-breakpoint
CREATE INDEX "song_revisions_queue_idx" ON "song_revisions" USING btree ("status","created_at");--> statement-breakpoint
CREATE INDEX "song_revisions_author_idx" ON "song_revisions" USING btree ("author_id");