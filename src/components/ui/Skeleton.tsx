import type { ReactNode } from "react";

/**
 * Squelettes de chargement : des formes calmes en `bg-well` qui reprennent celles du contenu attendu.
 * Une pulsation lente d'opacité, coupée par `prefers-reduced-motion` (motion-safe). Le visuel est caché
 * aux lecteurs d'écran ; seule la phrase de `LoadingStatus` est annoncée (`role="status"`).
 */
const PULSE = "bg-well motion-safe:animate-pulse";

/** Barre de texte, ou bloc quand on lui donne une hauteur (couverture, bouton). Coins légers, sauf `rounded-…` donné. */
export function SkeletonBar({ className = "" }: { className?: string }) {
  const corners = /(^|\s)rounded-/.test(className) ? "" : "rounded-sm";
  return <div className={`${corners} ${PULSE} ${className}`} />;
}

/** Zone de chargement annoncée : `label` est lu aux lecteurs d'écran, le visuel ne l'est pas. */
export function LoadingStatus({ label, children, className }: { label: string; children: ReactNode; className?: string }) {
  return (
    <div role="status" className={className}>
      <span className="sr-only">{label}</span>
      <div aria-hidden="true">{children}</div>
    </div>
  );
}

/**
 * Ce qui ouvre chaque ligne :
 *  - cover  : couverture de club ou tuile de playlist (64 px), pour les PlaylistCard et la liste des clubs ;
 *  - avatar : initiales rondes (44 px), pour les membres ;
 *  - number : numéro de position, pour les chansons d'une playlist ;
 *  - none   : rien, pour un résultat de recherche ou un élément de la file de modération.
 */
export type SkeletonLeading = "cover" | "avatar" | "number" | "none";

const LEADING: Record<Exclude<SkeletonLeading, "none">, string> = {
  cover: "size-16 rounded-lg",
  avatar: "size-11 rounded-full",
  number: "size-7 rounded-full",
};

/** Largeurs des lignes de texte, qui alternent d'une ligne à l'autre pour ne pas faire un bloc uniforme. */
const WIDTHS = [
  ["w-3/5", "w-2/5", "w-1/4"],
  ["w-2/5", "w-1/3", "w-1/5"],
  ["w-1/2", "w-1/4", "w-1/3"],
];
const HEIGHTS = ["h-5", "h-4", "h-3.5"];

type RowsProps = {
  rows?: number;
  leading?: SkeletonLeading;
  lines?: 1 | 2 | 3;
  /** `button` : un bouton en bout de ligne (« Lire » d'une PlaylistCard). */
  trailing?: "button" | "none";
};

/** Lignes en squelette, sans annonce (à mettre dans un `LoadingStatus`, ou passer par `ListSkeleton`). */
export function SkeletonRows({ rows = 4, leading = "none", lines = 2, trailing = "none" }: RowsProps) {
  return (
    <ul className="flex flex-col gap-3">
      {Array.from({ length: rows }, (_, row) => (
        <li key={row} className="flex flex-wrap items-center gap-3 rounded-lg border border-line-subtle bg-card p-3">
          {leading === "none" ? null : <SkeletonBar className={`shrink-0 ${LEADING[leading]}`} />}
          <div className={`flex min-w-0 grow basis-32 flex-col gap-2.5 ${leading === "none" ? "py-1" : ""}`}>
            {Array.from({ length: lines }, (_, line) => (
              <SkeletonBar key={line} className={`${HEIGHTS[line]} ${WIDTHS[row % WIDTHS.length][line]}`} />
            ))}
          </div>
          {trailing === "button" ? <SkeletonBar className="h-11 w-20 shrink-0 rounded-md" /> : null}
        </li>
      ))}
    </ul>
  );
}

/**
 * Squelette d'une liste (playlists, clubs, membres, file de modération…), annoncé par `label`
 * (« Chargement des clubs… »). Exemple pour la file de modération :
 * `<ListSkeleton label={t("system.loading.list")} lines={3} />`.
 */
export function ListSkeleton({ label, className, ...rows }: RowsProps & { label: string; className?: string }) {
  return (
    <LoadingStatus label={label} className={className}>
      <SkeletonRows {...rows} />
    </LoadingStatus>
  );
}
