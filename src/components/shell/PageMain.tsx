import type { ReactNode } from "react";

/**
 * Contenu de page : colonne centrée (640 px max). En dessous de 768 px, il réserve en bas la place de la
 * barre d'onglets ; au-delà, la barre est en haut et seule la marge du bas reste.
 */
export function PageMain({ children }: { children: ReactNode }) {
  return (
    <main
      id="contenu"
      className="mx-auto w-full max-w-content flex-1 px-4 pt-6 pb-[calc(var(--size-tabbar)+env(safe-area-inset-bottom)+1.5rem)] md:pb-[calc(env(safe-area-inset-bottom)+1.5rem)]"
    >
      {children}
    </main>
  );
}
