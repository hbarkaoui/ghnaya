// Plan 1, tâche 10 : lecture en flux de l'export SQLite de LRCLIB (https://lrclib.net/db-dumps).
import Database from "better-sqlite3";

export interface LrclibTrack {
  id: number;
  name: string;
  artistName: string;
  plainLyrics: string;
}

// Schéma LRCLIB : core/migrations/01-initial/up.sql (tables tracks et lyrics).
const QUERY = `
  SELECT t.id AS id, t.name AS name, t.artist_name AS artistName, l.plain_lyrics AS plainLyrics
  FROM tracks t
  JOIN lyrics l ON l.id = t.last_lyrics_id
  WHERE l.has_plain_lyrics = 1
    AND COALESCE(l.instrumental, 0) = 0
    AND t.name IS NOT NULL AND t.artist_name IS NOT NULL AND l.plain_lyrics IS NOT NULL`;

export function* readLrclibTracks(dumpPath: string): Generator<LrclibTrack> {
  const sqlite = new Database(dumpPath, { readonly: true, fileMustExist: true });
  try {
    for (const row of sqlite.prepare(QUERY).iterate()) yield row as LrclibTrack;
  } finally {
    sqlite.close();
  }
}
