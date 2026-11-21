// Plan 1, tâche 5 : schéma du catalogue (spec §5). Les listes de valeurs viennent des types des écrans,
// pour qu'il n'y en ait qu'une. Chemin relatif : drizzle-kit ne résout pas l'alias `@/`.
import { sql } from "drizzle-orm";
import { boolean, integer, pgEnum, pgTable, primaryKey, text, timestamp, uniqueIndex, uuid } from "drizzle-orm/pg-core";
import { DIALECTS, SONG_SOURCES, TRANSLIT_STATUSES } from "../../types/catalog";

export { DIALECTS, SONG_SOURCES };
export type { Dialect, SongSource } from "../../types/catalog";

export const dialectEnum = pgEnum("dialect", DIALECTS);
export const songSourceEnum = pgEnum("song_source", SONG_SOURCES);
export const songStatusEnum = pgEnum("song_status", ["published", "removed"]);
export const translitStatusEnum = pgEnum("translit_status", TRANSLIT_STATUSES);
export const artistRoleEnum = pgEnum("artist_role", ["main", "feat"]);

const timestamps = {
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
};

export const artists = pgTable(
  "artists",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    nameAr: text("name_ar"),
    nameLatin: text("name_latin"),
    aliases: text("aliases").array().notNull().default(sql`'{}'::text[]`),
    identityKey: text("identity_key").notNull(),
    searchAr: text("search_ar").notNull().default(""),
    searchLatin: text("search_latin").notNull().default(""),
    searchKey: text("search_key").notNull().default(""),
    ...timestamps,
  },
  (t) => [uniqueIndex("artists_identity_key_uq").on(t.identityKey)],
);

export const songs = pgTable(
  "songs",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    titleAr: text("title_ar"),
    titleLatin: text("title_latin"),
    lyrics: text("lyrics").notNull(),
    lyricsTranslit: text("lyrics_translit"),
    translitStatus: translitStatusEnum("translit_status").notNull().default("none"),
    dialect: dialectEnum("dialect").notNull().default("other"),
    source: songSourceEnum("source").notNull(),
    sourceRef: text("source_ref"),
    dedupeKey: text("dedupe_key").notNull(),
    importLocked: boolean("import_locked").notNull().default(false),
    status: songStatusEnum("status").notNull().default("published"),
    removedReason: text("removed_reason"),
    searchAr: text("search_ar").notNull().default(""),
    searchLatin: text("search_latin").notNull().default(""),
    searchKey: text("search_key").notNull().default(""),
    lyricsSearchAr: text("lyrics_search_ar").notNull().default(""),
    lyricsSearchKey: text("lyrics_search_key").notNull().default(""),
    ...timestamps,
  },
  (t) => [
    uniqueIndex("songs_source_ref_uq").on(t.source, t.sourceRef),
    uniqueIndex("songs_source_dedupe_uq").on(t.source, t.dedupeKey).where(sql`source <> 'contribution'`),
  ],
);

export const songArtists = pgTable(
  "song_artists",
  {
    songId: uuid("song_id")
      .notNull()
      .references(() => songs.id, { onDelete: "cascade" }),
    artistId: uuid("artist_id")
      .notNull()
      .references(() => artists.id),
    role: artistRoleEnum("role").notNull(),
    position: integer("position").notNull(),
  },
  (t) => [primaryKey({ columns: [t.songId, t.artistId] })],
);

export const rateLimits = pgTable(
  "rate_limits",
  {
    key: text("key").notNull(),
    windowStart: timestamp("window_start", { withTimezone: true }).notNull(),
    count: integer("count").notNull(),
  },
  (t) => [primaryKey({ columns: [t.key, t.windowStart] })],
);
