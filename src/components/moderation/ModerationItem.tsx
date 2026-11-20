import { ChevronRight } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";

/**
 * Un élément de la file de modération (brief, « Élément de la file de modération ») : ses pastilles
 * (type ou motif), son titre, puis l'auteur et l'ancienneté, et un extrait facultatif. Toute la carte
 * ouvre l'élément, où se trouvent les actions (approuver / rejeter, retirer / corriger / classer).
 */
export function ModerationItem({
  href,
  badges,
  title,
  meta,
  excerpt,
}: {
  href: string;
  badges: ReactNode;
  title: ReactNode;
  meta: ReactNode;
  excerpt?: ReactNode;
}) {
  return (
    <li>
      <Link
        href={href}
        className="flex items-start gap-3 rounded-lg border border-line-subtle bg-card p-4 transition-colors duration-(--duration-fast) hover:bg-well"
      >
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">{badges}</div>
          <div className="mt-2">{title}</div>
          <p className="mt-1 text-sm text-ink-2">{meta}</p>
          {excerpt ? <p className="mt-2 line-clamp-2 text-sm text-ink-2">{excerpt}</p> : null}
        </div>
        <ChevronRight aria-hidden="true" className="mt-1 size-5 shrink-0 text-ink-3 rtl:-scale-x-100" />
      </Link>
    </li>
  );
}
