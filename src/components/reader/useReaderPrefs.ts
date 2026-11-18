"use client";

import { useMemo } from "react";
import { useLocalStorage } from "@/lib/useLocalStorage";

export const READER_SIZES = [1, 2, 3, 4, 5, 6] as const;
export type ReaderSize = (typeof READER_SIZES)[number];
export type ReaderTheme = "dark" | "light";

type Prefs = { size: ReaderSize; theme: ReaderTheme };

/** Défauts de la phase grill-me : sombre, 28 px (cran 3). */
const DEFAULT_PREFS: Prefs = { size: 3, theme: "dark" };
const KEY = "ghnaya.reader.prefs";

function parse(raw: string | null): Prefs {
  if (!raw) return DEFAULT_PREFS;
  try {
    const value = JSON.parse(raw) as Partial<Prefs>;
    const size = READER_SIZES.includes(value.size as ReaderSize) ? (value.size as ReaderSize) : DEFAULT_PREFS.size;
    const theme = value.theme === "light" || value.theme === "dark" ? value.theme : DEFAULT_PREFS.theme;
    return { size, theme };
  } catch {
    return DEFAULT_PREFS;
  }
}

/** Taille et thème du lecteur, mémorisés sur le téléphone d'une séance à l'autre. */
export function useReaderPrefs() {
  const [raw, setRaw] = useLocalStorage(KEY);
  const prefs = useMemo(() => parse(raw), [raw]);
  const save = (next: Prefs) => setRaw(JSON.stringify(next));

  return {
    ...prefs,
    canShrink: prefs.size > READER_SIZES[0],
    canGrow: prefs.size < READER_SIZES[READER_SIZES.length - 1],
    smaller: () => save({ ...prefs, size: Math.max(1, prefs.size - 1) as ReaderSize }),
    larger: () => save({ ...prefs, size: Math.min(6, prefs.size + 1) as ReaderSize }),
    toggleTheme: () => save({ ...prefs, theme: prefs.theme === "dark" ? "light" : "dark" }),
  };
}
