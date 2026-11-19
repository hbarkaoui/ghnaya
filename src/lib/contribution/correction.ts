import { artistDisplayName } from "@/components/song/artistName";
import type { Song } from "@/types/catalog";
import type { ProposalPayload } from "@/types/proposal";
import { normalizeMultiline } from "./validate";

/** Valeurs du formulaire de /contribuer, en texte brut (un champ par artiste). */
export interface ContributionFormValues {
  titleAr: string;
  titleLatin: string;
  artists: string[];
  lyrics: string;
  dialect: string;
  translit: string;
}

/**
 * Formulaire de correction pré-rempli avec la chanson (spec §8.3). Les artistes sont écrits dans
 * l'écriture de l'interface ; la translittération existante est reprise, pour pouvoir la corriger.
 */
export function formValuesFromSong(song: Song, locale: string): ContributionFormValues {
  return {
    titleAr: song.titleAr ?? "",
    titleLatin: song.titleLatin ?? "",
    artists: song.artists.map((a) => artistDisplayName(a, locale).name),
    lyrics: song.lyrics,
    dialect: song.dialect,
    translit: song.lyricsTranslit ?? "",
  };
}

const sameText = (a: string | null, b: string | null) => normalizeMultiline(a ?? "") === normalizeMultiline(b ?? "");

/** Une correction qui ne change rien à la chanson n'a pas à passer en modération. */
export function isSameAsSong(payload: ProposalPayload, song: Song): boolean {
  return (
    payload.titleAr === song.titleAr &&
    payload.titleLatin === song.titleLatin &&
    payload.dialect === song.dialect &&
    sameText(payload.lyrics, song.lyrics) &&
    sameText(payload.lyricsTranslit, song.lyricsTranslit) &&
    payload.artists.length === song.artists.length &&
    payload.artists.every((a, i) => a.id !== null && a.id === song.artists[i].id)
  );
}
