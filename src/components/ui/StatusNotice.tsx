"use client";

import { CircleCheck } from "lucide-react";
import { useEffect, type ReactNode } from "react";

/**
 * Confirmation affichée après une redirection (`?statut=…`) : « Vous avez rejoint Les Jasmins ».
 * Le paramètre est retiré de l'adresse une fois affiché, pour qu'un rechargement ou un lien copié
 * ne répète pas le message.
 */
export function StatusNotice({ children }: { children: ReactNode }) {
  useEffect(() => {
    const url = new URL(window.location.href);
    if (!url.searchParams.has("statut")) return;
    url.searchParams.delete("statut");
    window.history.replaceState(null, "", `${url.pathname}${url.search}${url.hash}`);
  }, []);

  return (
    <p role="status" className="flex items-start gap-2 rounded-lg bg-success-soft px-4 py-3 text-success">
      <CircleCheck aria-hidden="true" className="mt-0.5 size-5 shrink-0" />
      <span>{children}</span>
    </p>
  );
}
