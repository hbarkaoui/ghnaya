import Link from "next/link";
import type { ReactNode } from "react";
import { LogoLockup } from "@/components/brand/Logo";

export const HEADER_CLASS =
  "sticky top-0 z-30 border-b border-line-subtle bg-page pt-[env(safe-area-inset-top)]";

/**
 * En-tête des pages de premier niveau : le logo (lien vers l'accueil), et `children` en bout de ligne
 * (bascule de langue). Sans `next-intl/server` : `PageHeader` l'utilise côté serveur, et la page
 * d'erreur (composant client) aussi.
 */
export function RootHeaderBar({ homeLabel, children }: { homeLabel: string; children?: ReactNode }) {
  return (
    <header className={HEADER_CLASS}>
      <div className="mx-auto flex h-14 max-w-content items-center justify-between px-4">
        <Link href="/" aria-label={homeLabel} className="rounded-md">
          <LogoLockup />
        </Link>
        {children}
      </div>
    </header>
  );
}
