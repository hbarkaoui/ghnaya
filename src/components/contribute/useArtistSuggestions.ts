"use client";

import { useEffect, useState } from "react";
import type { KnownArtist } from "@/lib/contribution/artists";
import { countSignificant } from "@/lib/text/detectScript";

/** Délai après la dernière frappe avant d'interroger le serveur. */
const DEBOUNCE_MS = 200;

/**
 * Artistes connus qui répondent à ce qui est tapé (`GET /api/artistes?q=`), à partir de 2 lettres. Une réponse
 * qui arrive après une nouvelle frappe est ignorée. Réseau coupé ou réponse refusée : pas de suggestion, et la
 * saisie reste libre (un nom inconnu est un nouvel artiste).
 */
export function useArtistSuggestions(value: string): KnownArtist[] {
  const query = value.trim();
  const [found, setFound] = useState<{ query: string; artists: KnownArtist[] }>({ query: "", artists: [] });

  useEffect(() => {
    if (countSignificant(query) < 2) return;
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/artistes?q=${encodeURIComponent(query)}`, { signal: controller.signal });
        if (!res.ok) return;
        const body = (await res.json()) as { artists: KnownArtist[] };
        setFound({ query, artists: body.artists });
      } catch {
        // Annulée par une nouvelle frappe, ou réseau coupé.
      }
    }, DEBOUNCE_MS);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [query]);

  return found.query === query ? found.artists : [];
}
