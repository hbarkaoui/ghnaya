"use client";

import { useState } from "react";

/**
 * Aperçu de développement (/apercu/etats) : simule une coupure réseau pour les actions serveur.
 * Les requêtes d'action (POST avec l'en-tête Next-Action) échouent comme un fetch hors ligne
 * (TypeError « Failed to fetch »), jusqu'à la désactivation ou au rechargement de la page ; la
 * navigation, elle, continue de fonctionner, pour aller tester la feuille, l'édition ou les clubs.
 */
let realFetch: typeof window.fetch | null = null;

function isActionRequest(input: RequestInfo | URL, init?: RequestInit) {
  const method = init?.method ?? (input instanceof Request ? input.method : "GET");
  const headers = new Headers(init?.headers ?? (input instanceof Request ? input.headers : undefined));
  return method.toUpperCase() === "POST" && headers.has("next-action");
}

function setCut(cut: boolean) {
  if (cut && !realFetch) {
    const original = window.fetch;
    realFetch = original;
    window.fetch = (input, init) =>
      isActionRequest(input, init) ? Promise.reject(new TypeError("Failed to fetch")) : original(input, init);
  } else if (!cut && realFetch) {
    window.fetch = realFetch;
    realFetch = null;
  }
}

export function NetworkCutToggle() {
  const [cut, setCutState] = useState(() => realFetch !== null);

  return (
    <button
      type="button"
      aria-pressed={cut}
      onClick={() => {
        setCut(!cut);
        setCutState(!cut);
      }}
      className="inline-flex min-h-11 items-center rounded-md border border-line px-5 font-medium hover:bg-well aria-pressed:border-error aria-pressed:text-error"
    >
      {cut ? "Rétablir le réseau des actions" : "Couper le réseau des actions"}
    </button>
  );
}
