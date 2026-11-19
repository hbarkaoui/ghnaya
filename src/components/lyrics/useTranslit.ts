"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { requestTranslit } from "@/app/actions/translit";
import { initialTranslits, toTranslitState, translitView, type TranslitState } from "@/lib/translit/state";
import type { Song } from "@/types/catalog";

type TranslitSource = Pick<Song, "id" | "lyricsTranslit" | "translitStatus">;

/**
 * Translittération de la chanson affichée, partagée par le lecteur et la fiche chanson.
 *  - `songs` : les chansons que l'on peut afficher, lues au premier rendu seulement (leurs
 *    translittérations déjà en base sont reprises) ;
 *  - `songId` : la chanson affichée ;
 *  - `wanted` : un mode latin est demandé (« Arabe + latin » ou « Latin »).
 * Sans résultat connu alors qu'il est demandé, la génération est lancée à la demande (spec §7) ;
 * les résultats restent en mémoire le temps de la page, et un échec peut être réessayé.
 */
export function useTranslit(songs: TranslitSource[], songId: string, wanted: boolean) {
  const [translits, setTranslits] = useState(() => initialTranslits(songs));
  const inFlight = useRef(new Set<string>());
  // Une entrée peut être absente : on l'écrit explicitement (l'accès indexé est typé « toujours défini »).
  const state = translits[songId] as TranslitState | undefined;

  useEffect(() => {
    if (!wanted || translits[songId] || inFlight.current.has(songId)) return;
    inFlight.current.add(songId);
    requestTranslit(songId)
      .then((result) => setTranslits((prev) => ({ ...prev, [songId]: toTranslitState(result) })))
      .catch(() => setTranslits((prev) => ({ ...prev, [songId]: { kind: "failed" } })))
      .finally(() => inFlight.current.delete(songId));
  }, [wanted, translits, songId]);

  const retry = useCallback(
    () =>
      setTranslits((prev) => {
        const next = { ...prev };
        delete next[songId];
        return next;
      }),
    [songId],
  );

  return {
    view: translitView(wanted, state),
    /** Texte prêt à afficher sous l'arabe ou à sa place ; `null` tant qu'il n'existe pas. */
    text: state?.kind === "ready" ? state.text : null,
    status: state?.kind === "ready" ? state.status : null,
    retry,
  };
}
