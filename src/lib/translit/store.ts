// Plan 4, tâche 4 : le verrou de génération est un UPDATE conditionnel sur la chanson (spec §7, écart 3).
// Les écritures ne réussissent que si la chanson porte encore le verrou pris : `startedAt` sert de jeton.
import { sql } from "drizzle-orm";
import { db } from "@/lib/db/client";
import type { Dialect, TranslitStatus } from "@/types/catalog";
import type { TranslitInput } from "./generator";

export interface TranslitRow {
  translitStatus: TranslitStatus;
  lyricsTranslit: string | null;
}

export type Claim = TranslitInput & { startedAt: string };

/** État de la translittération d'une chanson publiée ; `null` pour une chanson absente ou retirée. */
export async function readTranslit(songId: string): Promise<TranslitRow | null> {
  const res = await db.execute<{ translit_status: TranslitStatus; lyrics_translit: string | null }>(sql`
    SELECT translit_status, lyrics_translit FROM songs WHERE id = ${songId} AND status = 'published'`);
  const row = res.rows[0];
  return row ? { translitStatus: row.translit_status, lyricsTranslit: row.lyrics_translit } : null;
}

/**
 * Prend le verrou : la chanson passe de `none` (ou d'un `generating` abandonné depuis plus de 2 minutes) à
 * `generating`. L'horodatage est arrondi à la milliseconde, pour revenir intact d'un aller-retour par `Date`.
 * `null` si une autre demande tient le verrou, ou si la chanson a déjà une translittération.
 */
export async function claimTranslit(songId: string): Promise<Claim | null> {
  const res = await db.execute<{ lyrics: string; dialect: Dialect; started_at: string }>(sql`
    UPDATE songs
    SET translit_status = 'generating', translit_started_at = date_trunc('milliseconds', clock_timestamp()), updated_at = now()
    WHERE id = ${songId} AND status = 'published'
      AND (translit_status = 'none'
        OR (translit_status = 'generating'
          AND (translit_started_at IS NULL OR translit_started_at < now() - interval '2 minutes')))
    RETURNING lyrics, dialect, to_char(translit_started_at AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"') AS started_at`);
  const row = res.rows[0];
  return row ? { lyrics: row.lyrics, dialect: row.dialect, startedAt: row.started_at } : null;
}

/** Enregistre le texte en `auto`, si la chanson porte encore ce verrou. `false` sinon : le résultat est jeté. */
export async function finishTranslit(songId: string, startedAt: string, text: string): Promise<boolean> {
  const res = await db.execute(sql`
    UPDATE songs
    SET lyrics_translit = ${text}, translit_status = 'auto', translit_started_at = NULL, updated_at = now()
    WHERE id = ${songId} AND translit_status = 'generating' AND translit_started_at = ${startedAt}::timestamptz`);
  return (res.rowCount ?? 0) > 0;
}

/** Rend la chanson à `none` après un échec ou le plafond, si elle porte encore ce verrou. */
export async function releaseTranslit(songId: string, startedAt: string): Promise<void> {
  await db.execute(sql`
    UPDATE songs
    SET translit_status = 'none', translit_started_at = NULL, updated_at = now()
    WHERE id = ${songId} AND translit_status = 'generating' AND translit_started_at = ${startedAt}::timestamptz`);
}
