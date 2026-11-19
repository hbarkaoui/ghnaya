"use client";

import { ChevronLeft } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

/**
 * Retour qui revient à la page précédente quand il y en a une (la recherche garde sa requête),
 * sinon à `fallbackHref` (lien ouvert directement). Un clic avec Cmd ou Ctrl ouvre toujours
 * `fallbackHref` dans un nouvel onglet : `onNavigate` ne concerne que la navigation dans la page.
 */
export function BackLink({ fallbackHref, label, className }: { fallbackHref: string; label: string; className: string }) {
  const router = useRouter();
  return (
    <Link
      href={fallbackHref}
      aria-label={label}
      className={className}
      onNavigate={(e) => {
        if (window.history.length > 1) {
          e.preventDefault();
          router.back();
        }
      }}
    >
      <ChevronLeft aria-hidden="true" className="size-6 rtl:-scale-x-100" />
    </Link>
  );
}
