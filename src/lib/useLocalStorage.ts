"use client";

import { useCallback, useSyncExternalStore } from "react";

/**
 * Valeur texte persistée dans localStorage, tolérante à son absence (navigation privée, stockage
 * bloqué) : une mémoire de secours prend le relais, et l'interface réagit quand même.
 * Le rendu serveur et la première hydratation voient `null`, puis la valeur stockée s'applique.
 */
const CHANGE_EVENT = "ghnaya:local-storage";
const memory = new Map<string, string>();

function read(key: string): string | null {
  try {
    return window.localStorage.getItem(key) ?? memory.get(key) ?? null;
  } catch {
    return memory.get(key) ?? null;
  }
}

function write(key: string, value: string | null): void {
  if (value === null) memory.delete(key);
  else memory.set(key, value);
  try {
    if (value === null) window.localStorage.removeItem(key);
    else window.localStorage.setItem(key, value);
  } catch {
    // Stockage indisponible : la mémoire de secours suffit pour la session.
  }
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

function subscribe(onChange: () => void): () => void {
  window.addEventListener("storage", onChange);
  window.addEventListener(CHANGE_EVENT, onChange);
  return () => {
    window.removeEventListener("storage", onChange);
    window.removeEventListener(CHANGE_EVENT, onChange);
  };
}

export function useLocalStorage(key: string): [string | null, (value: string | null) => void] {
  const value = useSyncExternalStore(
    subscribe,
    () => read(key),
    () => null,
  );
  const set = useCallback((next: string | null) => write(key, next), [key]);
  return [value, set];
}
