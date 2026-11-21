CREATE EXTENSION IF NOT EXISTS pg_trgm;
--> statement-breakpoint
CREATE EXTENSION IF NOT EXISTS unaccent;
--> statement-breakpoint
ALTER TABLE songs ADD CONSTRAINT songs_title_present CHECK (title_ar IS NOT NULL OR title_latin IS NOT NULL);
--> statement-breakpoint
CREATE INDEX songs_search_ar_trgm ON songs USING gin (search_ar gin_trgm_ops);
--> statement-breakpoint
CREATE INDEX songs_search_latin_trgm ON songs USING gin (search_latin gin_trgm_ops);
--> statement-breakpoint
CREATE INDEX songs_search_key_trgm ON songs USING gin (search_key gin_trgm_ops);
--> statement-breakpoint
CREATE INDEX songs_lyrics_search_ar_trgm ON songs USING gin (lyrics_search_ar gin_trgm_ops);
--> statement-breakpoint
CREATE INDEX songs_lyrics_search_key_trgm ON songs USING gin (lyrics_search_key gin_trgm_ops);
--> statement-breakpoint
CREATE INDEX artists_search_ar_trgm ON artists USING gin (search_ar gin_trgm_ops);
--> statement-breakpoint
CREATE INDEX artists_search_latin_trgm ON artists USING gin (search_latin gin_trgm_ops);
--> statement-breakpoint
CREATE INDEX artists_search_key_trgm ON artists USING gin (search_key gin_trgm_ops);
--> statement-breakpoint
CREATE INDEX songs_status_idx ON songs (status);
--> statement-breakpoint
CREATE INDEX song_artists_artist_idx ON song_artists (artist_id);
