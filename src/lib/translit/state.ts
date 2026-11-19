import type { Song } from "@/types/catalog";

/** Résultat connu de la translittération d'une chanson (absent = pas encore demandé). */
export type TranslitState =
  | { kind: "ready"; text: string; status: "auto" | "reviewed" }
  | { kind: "failed" }
  | { kind: "limit" };

/** Ce qu'il faut afficher : rien (arabe seul), génération en cours, translittération prête, échec, limite. */
export type TranslitView = "off" | "generating" | TranslitState["kind"];

/** Réponse de la génération à la demande (miroir de l'action serveur `requestTranslit`). */
export type TranslitResult =
  | { ok: true; text: string; status: "auto" }
  | { ok: false; reason: "failed" | "limit" };

/** Les translittérations déjà en base au chargement, automatiques ou relues, indexées par chanson. */
export function initialTranslits(
  songs: Pick<Song, "id" | "lyricsTranslit" | "translitStatus">[],
): Record<string, TranslitState> {
  const known: Record<string, TranslitState> = {};
  for (const song of songs) {
    if (song.lyricsTranslit && (song.translitStatus === "auto" || song.translitStatus === "reviewed")) {
      known[song.id] = { kind: "ready", text: song.lyricsTranslit, status: song.translitStatus };
    }
  }
  return known;
}

export function toTranslitState(result: TranslitResult): TranslitState {
  return result.ok ? { kind: "ready", text: result.text, status: result.status } : { kind: result.reason };
}

/**
 * Sans résultat connu alors qu'un mode latin est demandé, l'état « génération en cours » est dérivé :
 * c'est à l'appelant de lancer la demande.
 */
export function translitView(wanted: boolean, state: TranslitState | undefined): TranslitView {
  if (!wanted) return "off";
  return state?.kind ?? "generating";
}
