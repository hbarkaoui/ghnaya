/**
 * Types du catalogue, alignés sur le plan 1 (SongDetail, ArtistRef…), pour que les écrans
 * construits sur les données fictives se branchent ensuite sans changement sur la vraie base.
 */
export type Dialect = "tn" | "eg" | "lev" | "gulf" | "maghreb_other" | "msa" | "other";
export type SongSource = "lrclib" | "public_domain" | "contribution";

export interface ArtistRef {
  id: string;
  nameAr: string | null;
  nameLatin: string | null;
  role: "main" | "feat";
}

export interface Song {
  id: string;
  titleAr: string | null;
  titleLatin: string | null;
  lyrics: string;
  dialect: Dialect;
  source: SongSource;
  artists: ArtistRef[];
}

export interface PlaylistItem {
  position: number;
  songId: string;
  /** Note de l'animateur pour la séance (« tonalité Ré », « seulement le 1er couplet »). */
  note: string | null;
}

export interface Playlist {
  id: string;
  name: string;
  club: { slug: string; name: string } | null;
  items: PlaylistItem[];
}

/** Ce dont le lecteur de séance a besoin pour une position de la playlist. */
export interface ReaderEntry {
  position: number;
  note: string | null;
  song: Pick<Song, "id" | "titleAr" | "titleLatin" | "lyrics" | "artists">;
}
