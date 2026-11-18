import type { ReactNode } from "react";

/** Contenu de page : colonne centrée (640 px max), en réservant la place de la barre d'onglets. */
export function PageMain({ children }: { children: ReactNode }) {
  return (
    <main
      id="contenu"
      className="mx-auto w-full max-w-content flex-1 px-4 pt-6 pb-[calc(var(--size-tabbar)+env(safe-area-inset-bottom)+1.5rem)]"
    >
      {children}
    </main>
  );
}
