import { ChevronRight, type LucideIcon } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";

/* Lignes de 56 px (cibles de 44 px au moins). L'anneau de focus passe à l'intérieur de la ligne :
   la liste coupe ce qui déborde de ses coins arrondis. */
const ROW = "flex min-h-14 w-full items-center gap-3 px-4 py-2 text-start";
const INTERACTIVE = "transition-colors duration-(--duration-fast) hover:bg-well focus-visible:-outline-offset-3";

function RowIcon({ Icon, flip = false }: { Icon: LucideIcon; flip?: boolean }) {
  return <Icon aria-hidden="true" className={`size-5 shrink-0 text-ink-2 ${flip ? "rtl:-scale-x-100" : ""}`} />;
}

/** Groupe de lignes de menu, dans une carte. */
export function MenuList({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <ul className={`divide-y divide-line-subtle overflow-hidden rounded-lg border border-line-subtle bg-card ${className}`}>
      {children}
    </ul>
  );
}

/**
 * Ligne qui mène à une page : icône, libellé, pastille facultative (un compteur), chevron.
 * `flipIcon` : icône retournée en arabe (direction ou liste, voir tests/unit/i18n/support/rtlIcons.ts).
 */
export function MenuLink({
  href,
  Icon,
  label,
  badge,
  flipIcon = false,
}: {
  href: string;
  Icon: LucideIcon;
  label: string;
  badge?: ReactNode;
  flipIcon?: boolean;
}) {
  return (
    <li>
      <Link href={href} className={`${ROW} ${INTERACTIVE}`}>
        <RowIcon Icon={Icon} flip={flipIcon} />
        <span className="min-w-0 flex-1">{label}</span>
        {badge}
        <ChevronRight aria-hidden="true" className="size-5 shrink-0 text-ink-3 rtl:-scale-x-100" />
      </Link>
    </li>
  );
}

/** Ligne qui porte son propre contrôle à la fin (la bascule de langue, par exemple). */
export function MenuControl({ Icon, label, children }: { Icon: LucideIcon; label: string; children: ReactNode }) {
  return (
    <li className={ROW}>
      <RowIcon Icon={Icon} />
      <span className="min-w-0 flex-1">{label}</span>
      {children}
    </li>
  );
}

/** Ligne-bouton d'un formulaire (une action serveur), dans sa propre carte. */
export function MenuAction({
  action,
  Icon,
  label,
  flipIcon = false,
}: {
  action: () => Promise<void>;
  Icon: LucideIcon;
  label: string;
  flipIcon?: boolean;
}) {
  return (
    <form action={action} className="overflow-hidden rounded-lg border border-line-subtle bg-card">
      <button type="submit" className={`${ROW} ${INTERACTIVE}`}>
        <RowIcon Icon={Icon} flip={flipIcon} />
        <span className="min-w-0 flex-1">{label}</span>
      </button>
    </form>
  );
}
