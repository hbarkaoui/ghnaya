import { normalizeMultiline } from "@/lib/contribution/validate";
import type { ArtistRef, Song } from "@/types/catalog";
import type { ProposalPayload } from "@/types/proposal";

/** Champs d'une proposition comparés à la chanson, en plus des paroles (vue des différences). */
export const COMPARED_FIELDS = ["titleAr", "titleLatin", "artists", "dialect", "translit"] as const;
export type ComparedField = (typeof COMPARED_FIELDS)[number];

const sameText = (a: string | null, b: string | null) => normalizeMultiline(a ?? "") === normalizeMultiline(b ?? "");

/** Mêmes artistes, dans le même ordre ; un artiste nouveau (`id` nul) compte toujours comme un changement. */
const sameArtists = (payload: ProposalPayload, song: Song) =>
  payload.artists.length === song.artists.length &&
  payload.artists.every((a, i) => a.id !== null && a.id === song.artists[i].id);

/**
 * Les champs qu'une correction modifie, hors paroles (spec §8.4 : « plus les champs modifiés »), dans
 * l'ordre du formulaire. Les paroles ont leur propre vue des différences.
 */
export function changedFields(payload: ProposalPayload, song: Song): ComparedField[] {
  const changed: Record<ComparedField, boolean> = {
    titleAr: payload.titleAr !== song.titleAr,
    titleLatin: payload.titleLatin !== song.titleLatin,
    artists: !sameArtists(payload, song),
    dialect: payload.dialect !== song.dialect,
    translit: !sameText(payload.lyricsTranslit, song.lyricsTranslit),
  };
  return COMPARED_FIELDS.filter((field) => changed[field]);
}

/**
 * La chanson telle qu'elle est publiée à l'approbation (spec §8.5) :
 *  - un ajout (`song` absent) crée la chanson, source « Proposition » ;
 *  - une correction met à jour la chanson, en gardant son identifiant, sa source et le rôle des artistes ;
 *  - si les paroles changent sans nouvelle translittération, la translittération est vidée ;
 *  - une translittération fournie ou corrigée par l'auteur, et approuvée, est publiée comme relue.
 * Les nouveaux artistes reçoivent un identifiant (`ids.artistId`). Les colonnes de recherche sont
 * recalculées par la recherche elle-même (`indexSong`).
 */
export function songFromProposal(
  payload: ProposalPayload,
  song: Song | undefined,
  ids: { songId: string; artistId: (index: number) => string },
): Song {
  const artists: ArtistRef[] = payload.artists.map((artist, i) => ({
    id: artist.id ?? ids.artistId(i),
    nameAr: artist.nameAr,
    nameLatin: artist.nameLatin,
    role: song?.artists.find((a) => a.id === artist.id)?.role ?? "main",
  }));

  const lyricsChanged = !song || !sameText(payload.lyrics, song.lyrics);
  const translitChanged = !song || !sameText(payload.lyricsTranslit, song.lyricsTranslit);
  const translit: Pick<Song, "lyricsTranslit" | "translitStatus"> =
    payload.lyricsTranslit !== null && translitChanged
      ? { lyricsTranslit: payload.lyricsTranslit, translitStatus: "reviewed" }
      : payload.lyricsTranslit !== null && !lyricsChanged && song
        ? { lyricsTranslit: song.lyricsTranslit, translitStatus: song.translitStatus }
        : { lyricsTranslit: null, translitStatus: "none" };

  return {
    id: song?.id ?? ids.songId,
    titleAr: payload.titleAr,
    titleLatin: payload.titleLatin,
    dialect: payload.dialect,
    source: song?.source ?? "contribution",
    artists,
    lyrics: payload.lyrics,
    ...translit,
  };
}
