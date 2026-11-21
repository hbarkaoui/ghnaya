CREATE TYPE "public"."artist_role" AS ENUM('main', 'feat');--> statement-breakpoint
CREATE TYPE "public"."dialect" AS ENUM('tn', 'eg', 'lev', 'gulf', 'maghreb_other', 'msa', 'other');--> statement-breakpoint
CREATE TYPE "public"."song_source" AS ENUM('lrclib', 'public_domain', 'contribution');--> statement-breakpoint
CREATE TYPE "public"."song_status" AS ENUM('published', 'removed');--> statement-breakpoint
CREATE TYPE "public"."translit_status" AS ENUM('none', 'generating', 'auto', 'reviewed');--> statement-breakpoint
CREATE TABLE "artists" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name_ar" text,
	"name_latin" text,
	"aliases" text[] DEFAULT '{}'::text[] NOT NULL,
	"identity_key" text NOT NULL,
	"search_ar" text DEFAULT '' NOT NULL,
	"search_latin" text DEFAULT '' NOT NULL,
	"search_key" text DEFAULT '' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "rate_limits" (
	"key" text NOT NULL,
	"window_start" timestamp with time zone NOT NULL,
	"count" integer NOT NULL,
	CONSTRAINT "rate_limits_key_window_start_pk" PRIMARY KEY("key","window_start")
);
--> statement-breakpoint
CREATE TABLE "song_artists" (
	"song_id" uuid NOT NULL,
	"artist_id" uuid NOT NULL,
	"role" "artist_role" NOT NULL,
	"position" integer NOT NULL,
	CONSTRAINT "song_artists_song_id_artist_id_pk" PRIMARY KEY("song_id","artist_id")
);
--> statement-breakpoint
CREATE TABLE "songs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title_ar" text,
	"title_latin" text,
	"lyrics" text NOT NULL,
	"lyrics_translit" text,
	"translit_status" "translit_status" DEFAULT 'none' NOT NULL,
	"dialect" "dialect" DEFAULT 'other' NOT NULL,
	"source" "song_source" NOT NULL,
	"source_ref" text,
	"dedupe_key" text NOT NULL,
	"import_locked" boolean DEFAULT false NOT NULL,
	"status" "song_status" DEFAULT 'published' NOT NULL,
	"removed_reason" text,
	"search_ar" text DEFAULT '' NOT NULL,
	"search_latin" text DEFAULT '' NOT NULL,
	"search_key" text DEFAULT '' NOT NULL,
	"lyrics_search_ar" text DEFAULT '' NOT NULL,
	"lyrics_search_key" text DEFAULT '' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "song_artists" ADD CONSTRAINT "song_artists_song_id_songs_id_fk" FOREIGN KEY ("song_id") REFERENCES "public"."songs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "song_artists" ADD CONSTRAINT "song_artists_artist_id_artists_id_fk" FOREIGN KEY ("artist_id") REFERENCES "public"."artists"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "artists_identity_key_uq" ON "artists" USING btree ("identity_key");--> statement-breakpoint
CREATE UNIQUE INDEX "songs_source_ref_uq" ON "songs" USING btree ("source","source_ref");--> statement-breakpoint
CREATE UNIQUE INDEX "songs_source_dedupe_uq" ON "songs" USING btree ("source","dedupe_key") WHERE source <> 'contribution';