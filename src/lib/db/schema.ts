// Plan 1, tâche 5 : schéma du catalogue (spec §5). Les listes de valeurs viennent des types des écrans,
// pour qu'il n'y en ait qu'une. Chemin relatif : drizzle-kit ne résout pas l'alias `@/`.
import { sql } from "drizzle-orm";
import {
  boolean,
  check,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import { DIALECTS, SONG_SOURCES, TRANSLIT_STATUSES } from "../../types/catalog";
import { PROPOSAL_STATUSES, type ProposalPayload } from "../../types/proposal";
import { REPORT_REASONS, REPORT_STATUSES } from "../../types/report";

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
    /** Le retrait vient de `pnpm songs:remove` : seul `--restore` le reconnaît, pas un retrait sur signalement. */
    removedByBulk: boolean("removed_by_bulk").notNull().default(false),
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

// Plan 2, tâche 1 : comptes (tables imposées par Better Auth, spec §5 adaptée), clubs et playlists (spec §5, §10).
export const globalRoleEnum = pgEnum("global_role", ["member", "moderator", "admin"]);
export const localeEnum = pgEnum("locale", ["fr", "ar"]);
export const clubRoleEnum = pgEnum("club_role", ["animator", "member"]);

export const users = pgTable(
  "users",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: text("name").notNull(),
    email: text("email").notNull(),
    emailVerified: boolean("email_verified").notNull().default(false),
    image: text("image"),
    globalRole: globalRoleEnum("global_role").notNull().default("member"),
    isAnimator: boolean("is_animator").notNull().default(false),
    locale: localeEnum("locale").notNull().default("fr"),
    ...timestamps,
  },
  (t) => [uniqueIndex("users_email_uq").on(t.email)],
);

export const sessions = pgTable(
  "sessions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    token: text("token").notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    ...timestamps,
  },
  (t) => [uniqueIndex("sessions_token_uq").on(t.token), index("sessions_user_idx").on(t.userId)],
);

export const accounts = pgTable(
  "accounts",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    accountId: text("account_id").notNull(),
    providerId: text("provider_id").notNull(),
    accessToken: text("access_token"),
    refreshToken: text("refresh_token"),
    idToken: text("id_token"),
    accessTokenExpiresAt: timestamp("access_token_expires_at", { withTimezone: true }),
    refreshTokenExpiresAt: timestamp("refresh_token_expires_at", { withTimezone: true }),
    scope: text("scope"),
    password: text("password"),
    ...timestamps,
  },
  (t) => [index("accounts_user_idx").on(t.userId)],
);

export const verifications = pgTable(
  "verifications",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    identifier: text("identifier").notNull(),
    value: text("value").notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    ...timestamps,
  },
  (t) => [index("verifications_identifier_idx").on(t.identifier)],
);

export const clubs = pgTable(
  "clubs",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: text("name").notNull(),
    slug: text("slug").notNull(),
    description: text("description"),
    inviteCode: text("invite_code").notNull(),
    // Le créateur peut supprimer son compte une fois le club confié à un autre animateur.
    createdBy: uuid("created_by").references(() => users.id, { onDelete: "set null" }),
    ...timestamps,
  },
  (t) => [uniqueIndex("clubs_slug_uq").on(t.slug), uniqueIndex("clubs_invite_code_uq").on(t.inviteCode)],
);

export const clubMembers = pgTable(
  "club_members",
  {
    clubId: uuid("club_id")
      .notNull()
      .references(() => clubs.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    role: clubRoleEnum("role").notNull().default("member"),
    ...timestamps,
  },
  (t) => [primaryKey({ columns: [t.clubId, t.userId] }), index("club_members_user_idx").on(t.userId)],
);

export const playlists = pgTable(
  "playlists",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: text("name").notNull(),
    ownerUserId: uuid("owner_user_id").references(() => users.id, { onDelete: "cascade" }),
    clubId: uuid("club_id").references(() => clubs.id, { onDelete: "cascade" }),
    createdBy: uuid("created_by").references(() => users.id, { onDelete: "set null" }),
    ...timestamps,
  },
  (t) => [
    check("playlists_owner_ck", sql`(${t.ownerUserId} IS NULL) <> (${t.clubId} IS NULL)`),
    index("playlists_owner_idx").on(t.ownerUserId),
    index("playlists_club_idx").on(t.clubId),
  ],
);

export const playlistItems = pgTable(
  "playlist_items",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    playlistId: uuid("playlist_id")
      .notNull()
      .references(() => playlists.id, { onDelete: "cascade" }),
    // Pas de cascade : une chanson n'est jamais supprimée, seulement retirée (spec §5, retrait doux).
    songId: uuid("song_id")
      .notNull()
      .references(() => songs.id),
    position: integer("position").notNull(),
    note: text("note"),
    ...timestamps,
  },
  (t) => [
    uniqueIndex("playlist_items_position_uq").on(t.playlistId, t.position),
    uniqueIndex("playlist_items_song_uq").on(t.playlistId, t.songId),
  ],
);

// Plan 3, tâche 1 : propositions (révisions) et signalements (spec §5, §8, §9).
export const revisionStatusEnum = pgEnum("revision_status", PROPOSAL_STATUSES);
export const reportReasonEnum = pgEnum("report_reason", REPORT_REASONS);
export const reportStatusEnum = pgEnum("report_status", REPORT_STATUSES);

export const songRevisions = pgTable(
  "song_revisions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    // Nul pour un ajout. Pas de cascade : une chanson n'est jamais supprimée, seulement retirée.
    songId: uuid("song_id").references(() => songs.id),
    // Nul une fois le compte supprimé : la proposition reste, anonymisée (écart 1).
    authorId: uuid("author_id").references(() => users.id, { onDelete: "set null" }),
    // Version complète proposée (titres, artistes, paroles, translittération, dialecte).
    payload: jsonb("payload").$type<ProposalPayload>().notNull(),
    rightsDeclared: boolean("rights_declared").notNull(),
    status: revisionStatusEnum("status").notNull().default("pending"),
    reviewerId: uuid("reviewer_id").references(() => users.id, { onDelete: "set null" }),
    reviewNote: text("review_note"),
    reviewedAt: timestamp("reviewed_at", { withTimezone: true }),
    ...timestamps,
  },
  (t) => [
    // Une seule révision en attente par auteur et par chanson (spec §8.3). Un ajout (`song_id` nul) et un
    // auteur supprimé (`author_id` nul) n'y sont pas soumis : deux valeurs nulles ne sont jamais égales.
    uniqueIndex("song_revisions_pending_uq").on(t.authorId, t.songId).where(sql`status = 'pending'`),
    index("song_revisions_queue_idx").on(t.status, t.createdAt),
    index("song_revisions_author_idx").on(t.authorId),
    check("song_revisions_rights_ck", sql`${t.rightsDeclared} = true`),
    check("song_revisions_reviewed_ck", sql`(${t.status} = 'pending') = (${t.reviewedAt} IS NULL)`),
    check("song_revisions_reject_note_ck", sql`${t.status} <> 'rejected' OR ${t.reviewNote} IS NOT NULL`),
  ],
);

export const reports = pgTable(
  "reports",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    songId: uuid("song_id")
      .notNull()
      .references(() => songs.id),
    // Nul pour un visiteur (qui laisse `contact_email`), ou une fois le compte supprimé (écart 1).
    reporterId: uuid("reporter_id").references(() => users.id, { onDelete: "set null" }),
    contactEmail: text("contact_email"),
    reason: reportReasonEnum("reason").notNull(),
    details: text("details").notNull(),
    status: reportStatusEnum("status").notNull().default("open"),
    resolutionNote: text("resolution_note"),
    resolvedBy: uuid("resolved_by").references(() => users.id, { onDelete: "set null" }),
    ...timestamps,
  },
  (t) => [
    index("reports_queue_idx").on(t.status, t.createdAt),
    index("reports_song_idx").on(t.songId),
    // Un signalement traité ou classé porte toujours sa note (spec §9) ; un signalement ouvert n'en a pas.
    check("reports_resolution_ck", sql`(${t.status} = 'open') = (${t.resolutionNote} IS NULL)`),
  ],
);
