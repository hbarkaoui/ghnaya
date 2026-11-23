import "server-only";
import { eq, sql } from "drizzle-orm";
import { upsertArtist } from "@/lib/catalog/artists";
import { ARTISTS_OF } from "@/lib/catalog/queries";
import { songSearchColumns } from "@/lib/catalog/searchColumns";
import { songDedupeKey } from "@/lib/catalog/songs";
import type { Db } from "@/lib/db/client";
import { isUniqueViolation } from "@/lib/db/errors";
import { songArtists, songRevisions } from "@/lib/db/schema";
import { inList } from "@/lib/db/sqlList";
import { songFromProposal } from "@/lib/moderation/apply";
import type { ArtistRef, Dialect, Song, SongSource, TranslitStatus } from "@/types/catalog";
import type { ProposalPayload, ProposalStatus } from "@/types/proposal";

/**
 * Écritures des propositions (spec §8). L'appelant (Server Action) a vérifié la session, le droit
 * (`canContribute`, `canApproveRevision`), la limite du jour et le formulaire (`validateProposal`).
 */

export type CreateRevisionResult = { ok: true; id: string } | { ok: false; error: "pendingExists" };

/**
 * Enregistre une proposition en attente (spec §8.3). Une seconde correction en attente de la même chanson
 * par le même auteur est refusée par l'index unique `song_revisions_pending_uq`, même si deux envois se croisent.
 */
export async function createRevision(
  db: Db,
  input: { authorId: string; songId: string | null; payload: ProposalPayload },
): Promise<CreateRevisionResult> {
  try {
    const [row] = await db
      .insert(songRevisions)
      .values({ authorId: input.authorId, songId: input.songId, payload: input.payload, rightsDeclared: true })
      .returning({ id: songRevisions.id });
    return { ok: true, id: row.id };
  } catch (error) {
    if (isUniqueViolation(error)) return { ok: false, error: "pendingExists" };
    throw error;
  }
}

/** Raisons d'une décision refusée : proposition inconnue, déjà relue, ou chanson retirée entre-temps. */
export type DecisionError = "notFound" | "notPending" | "songGone";

/** Rejette une proposition en attente, avec la note que l'auteur lira dans Mes contributions (spec §8.4). */
export async function rejectRevision(
  db: Db,
  input: { revisionId: string; reviewerId: string; note: string },
): Promise<{ ok: true } | { ok: false; error: Exclude<DecisionError, "songGone"> }> {
  const res = await db.execute(sql`
    UPDATE song_revisions
    SET status = 'rejected', reviewer_id = ${input.reviewerId}, review_note = ${input.note},
      reviewed_at = now(), updated_at = now()
    WHERE id = ${input.revisionId} AND status = 'pending'
    RETURNING id`);
  if (res.rows.length > 0) return { ok: true };
  const found = await db.execute(sql`SELECT 1 FROM song_revisions WHERE id = ${input.revisionId}`);
  return { ok: false, error: found.rows.length > 0 ? "notPending" : "notFound" };
}

export type ApproveResult = { ok: true; songId: string } | { ok: false; error: DecisionError };

type LockedSong = {
  id: string;
  title_ar: string | null;
  title_latin: string | null;
  lyrics: string;
  lyrics_translit: string | null;
  translit_status: TranslitStatus;
  dialect: Dialect;
  source: SongSource;
  status: "published" | "removed";
  artists: ArtistRef[];
};

type ArtistNamesRow = {
  id: string;
  name_ar: string | null;
  name_latin: string | null;
  aliases: string[];
  identity_key: string;
};

/**
 * Approuve une proposition (spec §8.5), en une transaction. Verrous : la proposition, puis la chanson
 * corrigée. Les nouveaux artistes sont créés, ou retrouvés par leur clé d'identité s'ils existent déjà.
 * Un ajout crée la chanson (source « contribution ») ; une correction la met à jour sous le même identifiant,
 * avec la même source, et la verrouille contre les imports (écart 6). Les colonnes de recherche sont
 * recalculées. Un refus (`ok: false`) n'écrit rien : il survient avant toute écriture.
 */
export function approveRevision(
  db: Db,
  input: { revisionId: string; reviewerId: string; note: string | null },
): Promise<ApproveResult> {
  return db.transaction(async (tx): Promise<ApproveResult> => {
    const found = await tx.execute<{ song_id: string | null; payload: ProposalPayload; status: ProposalStatus }>(sql`
      SELECT song_id, payload, status FROM song_revisions WHERE id = ${input.revisionId} FOR UPDATE`);
    const revision = found.rows[0];
    if (!revision) return { ok: false, error: "notFound" };
    if (revision.status !== "pending") return { ok: false, error: "notPending" };

    let current: Song | undefined;
    if (revision.song_id) {
      const res = await tx.execute<LockedSong>(sql`
        SELECT s.id, s.title_ar, s.title_latin, s.lyrics, s.lyrics_translit, s.translit_status, s.dialect, s.source,
          s.status, ${ARTISTS_OF("s")} AS artists
        FROM songs s WHERE s.id = ${revision.song_id} FOR UPDATE OF s`);
      const row = res.rows[0];
      if (!row || row.status !== "published") return { ok: false, error: "songGone" };
      current = {
        id: row.id,
        titleAr: row.title_ar,
        titleLatin: row.title_latin,
        lyrics: row.lyrics,
        lyricsTranslit: row.lyrics_translit,
        translitStatus: row.translit_status,
        dialect: row.dialect,
        source: row.source,
        artists: row.artists,
      };
    }

    // Artistes nouveaux (`id` nul), par leur position dans la proposition.
    const createdArtists = new Map<number, string>();
    for (const [index, artist] of revision.payload.artists.entries()) {
      if (artist.id !== null) continue;
      const created = await upsertArtist(tx, {
        nameAr: artist.nameAr ?? undefined,
        nameLatin: artist.nameLatin ?? undefined,
      });
      createdArtists.set(index, created.id);
    }

    // Identifiant de la nouvelle chanson, tiré par PostgreSQL comme tous les identifiants du projet.
    const songId =
      current?.id ?? (await tx.execute<{ id: string }>(sql`SELECT gen_random_uuid() AS id`)).rows[0].id;
    const song = songFromProposal(revision.payload, current, {
      songId,
      artistId: (index) => createdArtists.get(index)!,
    });
    // Un nouvel artiste peut se confondre avec un artiste déjà cité (même clé d'identité) : une seule fois.
    const artists = song.artists.filter((a, i, all) => all.findIndex((b) => b.id === a.id) === i);

    const names = await tx.execute<ArtistNamesRow>(sql`
      SELECT id, name_ar, name_latin, aliases, identity_key FROM artists WHERE id IN (${inList(artists.map((a) => a.id))})`);
    const byId = new Map(names.rows.map((r) => [r.id, r]));
    const cols = songSearchColumns({
      titleAr: song.titleAr,
      titleLatin: song.titleLatin,
      lyrics: song.lyrics,
      artists: artists.map((a) => {
        const r = byId.get(a.id)!;
        return { nameAr: r.name_ar, nameLatin: r.name_latin, aliases: r.aliases };
      }),
    });

    if (current) {
      await tx.execute(sql`
        UPDATE songs SET title_ar = ${song.titleAr}, title_latin = ${song.titleLatin}, lyrics = ${song.lyrics},
          lyrics_translit = ${song.lyricsTranslit}, translit_status = ${song.translitStatus}, dialect = ${song.dialect},
          search_ar = ${cols.searchAr}, search_latin = ${cols.searchLatin}, search_key = ${cols.searchKey},
          lyrics_search_ar = ${cols.lyricsSearchAr}, lyrics_search_key = ${cols.lyricsSearchKey},
          import_locked = true, updated_at = now()
        WHERE id = ${songId}`);
      await tx.delete(songArtists).where(eq(songArtists.songId, songId));
    } else {
      const title = song.titleAr ?? song.titleLatin ?? "";
      const dedupeKey = songDedupeKey(byId.get(artists[0].id)!.identity_key, title);
      await tx.execute(sql`
        INSERT INTO songs (id, title_ar, title_latin, lyrics, lyrics_translit, translit_status, dialect, source,
          dedupe_key, search_ar, search_latin, search_key, lyrics_search_ar, lyrics_search_key)
        VALUES (${songId}, ${song.titleAr}, ${song.titleLatin}, ${song.lyrics}, ${song.lyricsTranslit},
          ${song.translitStatus}, ${song.dialect}, 'contribution', ${dedupeKey}, ${cols.searchAr}, ${cols.searchLatin},
          ${cols.searchKey}, ${cols.lyricsSearchAr}, ${cols.lyricsSearchKey})`);
    }
    await tx
      .insert(songArtists)
      .values(artists.map((a, position) => ({ songId, artistId: a.id, role: a.role, position })));

    await tx.execute(sql`
      UPDATE song_revisions
      SET status = 'approved', reviewer_id = ${input.reviewerId}, review_note = ${input.note},
        reviewed_at = now(), updated_at = now()
      WHERE id = ${input.revisionId}`);
    return { ok: true, songId };
  });
}
