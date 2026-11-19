import Link from "next/link";
import type { ReactNode } from "react";

/**
 * Ligne d'une playlist (IA, « Playlist ») : le numéro dans le lecteur, le titre et les artistes, puis la note.
 *  - en consultation (`href`) : toute la ligne ouvre le lecteur à cette position ;
 *  - en édition (`actions`, et un champ à la place de la note) : ↑ ↓ ✕ en bout de ligne ;
 *  - chanson retirée (`number` à `null`) : ni numéro ni lien. Elle reste dans la liste, pour que
 *    l'animateur voie ce qui manque et puisse la retirer.
 *
 * Sans état ni appel au serveur : la page (composant serveur) et l'éditeur (composant client)
 * l'utilisent tous les deux, avec une étiquette (`label`) rendue par le serveur.
 */
export function PlaylistRow({
  number,
  label,
  href,
  note,
  actions,
}: {
  /** Position dans le lecteur, à partir de 1 ; `null` pour une chanson retirée, qui n'est pas lisible. */
  number: number | null;
  label: ReactNode;
  href?: string;
  note?: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <li
      className={`relative grid grid-cols-[1.75rem_minmax(0,1fr)_auto] gap-x-2 rounded-lg border border-line-subtle bg-card p-3 ${
        href ? "transition-colors duration-(--duration-fast) hover:bg-well" : ""
      }`}
    >
      <span
        aria-hidden={number === null ? true : undefined}
        className="pt-0.5 text-center text-md font-medium text-ink-2 tabular-nums"
      >
        {number ?? "–"}
      </span>
      <div className="min-w-0">
        {href ? (
          <Link href={href} className="block rounded-sm after:absolute after:inset-0 after:rounded-lg">
            {label}
          </Link>
        ) : (
          label
        )}
      </div>
      {actions ? <div className="relative z-10 -my-1 flex items-start">{actions}</div> : <span />}
      {note ? <div className="col-span-2 col-start-2 mt-2">{note}</div> : null}
    </li>
  );
}
