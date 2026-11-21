// Plan 1, tâche 8 (adaptée) : lecture du catalogue en base pour la fiche chanson et la page artiste.
import { sql } from "drizzle-orm";
import { ARTIST_PAGE_SIZE } from "@/lib/artist/routes";
import type { ArtistPage } from "@/lib/artist/types";
import { db } from "@/lib/db/client";
import type { Dialect, SongSource } from "@/lib/db/schema";
import type { ArtistRef, Song, TranslitStatus } from "@/types/catalog";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export const isUuid = (value: string): boolean => UUID_RE.test(value);

/** Artistes d'une chanson `s`, dans l'ordre du générique, en JSON (`ArtistRef[]`). */
const ARTISTS_OF = (songAlias: string) =>
  sql.raw(`COALESCE((
    SELECT json_agg(json_build_object(
      'id', a.id, 'nameAr', a.name_ar, 'nameLatin', a.name_latin, 'role', sa.role
    ) ORDER BY sa.position)
    FROM song_artists sa JOIN artists a ON a.id = sa.artist_id WHERE sa.song_id = ${songAlias}.id
  ), '[]'::json)`);

/** Chanson publiée, avec ses artistes. `null` si l'identifiant est invalide, inconnu, ou la chanson retirée. */
export async function getSongById(id: string): Promise<Song | null> {
  if (!isUuid(id)) return null;
  const res = await db.execute<{
    id: string;
    title_ar: string | null;
    title_latin: string | null;
    lyrics: string;
    lyrics_translit: string | null;
    translit_status: TranslitStatus;
    dialect: Dialect;
    source: SongSource;
    artists: ArtistRef[];
  }>(sql`
    SELECT s.id, s.title_ar, s.title_latin, s.lyrics, s.lyrics_translit, s.translit_status,
      s.dialect, s.source, ${ARTISTS_OF("s")} AS artists
    FROM songs s
    WHERE s.id = ${id} AND s.status = 'published'`);
  const r = res.rows[0];
  if (!r) return null;
  return {
    id: r.id,
    titleAr: r.title_ar,
    titleLatin: r.title_latin,
    lyrics: r.lyrics,
    lyricsTranslit: r.lyrics_translit,
    translitStatus: r.translit_status,
    dialect: r.dialect,
    source: r.source,
    artists: r.artists,
  };
}

/**
 * Page artiste : l'artiste, le nombre de ses chansons publiées (principal ou invité) et une page de ces
 * chansons, triées par titre. `null` si l'identifiant est invalide, l'artiste inconnu, ou s'il n'a plus
 * aucune chanson publiée. Au-delà de la dernière page, la liste est vide et le total reste connu.
 */
export async function getArtistPage(id: string, page: number, pageSize = ARTIST_PAGE_SIZE): Promise<ArtistPage | null> {
  if (!isUuid(id)) return null;
  const head = await db.execute<{ id: string; name_ar: string | null; name_latin: string | null; total: string }>(sql`
    SELECT a.id, a.name_ar, a.name_latin,
      (SELECT count(*) FROM song_artists sa JOIN songs s ON s.id = sa.song_id
        WHERE sa.artist_id = a.id AND s.status = 'published') AS total
    FROM artists a
    WHERE a.id = ${id}`);
  const artist = head.rows[0];
  const total = artist ? Number(artist.total) : 0;
  if (!artist || total === 0) return null;

  const rows = await db.execute<{
    id: string;
    title_ar: string | null;
    title_latin: string | null;
    dialect: Dialect;
    artists: ArtistRef[];
  }>(sql`
    SELECT s.id, s.title_ar, s.title_latin, s.dialect, ${ARTISTS_OF("s")} AS artists
    FROM song_artists f JOIN songs s ON s.id = f.song_id
    WHERE f.artist_id = ${id} AND s.status = 'published'
    ORDER BY COALESCE(s.title_latin, s.title_ar) ASC, s.id
    LIMIT ${pageSize} OFFSET ${(page - 1) * pageSize}`);

  return {
    artist: { id: artist.id, nameAr: artist.name_ar, nameLatin: artist.name_latin },
    total,
    page,
    lastPage: Math.max(1, Math.ceil(total / pageSize)),
    items: rows.rows.map((r) => ({
      id: r.id,
      titleAr: r.title_ar,
      titleLatin: r.title_latin,
      dialect: r.dialect,
      artists: r.artists,
      snippet: null,
    })),
  };
}
