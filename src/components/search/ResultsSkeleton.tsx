const BAR = "rounded-sm bg-well motion-safe:animate-pulse";
const PILL = "rounded-full bg-well motion-safe:animate-pulse";

/**
 * Squelette de la liste de résultats, pendant la recherche. Il reprend la forme d'un SongResultItem
 * (titre, titre latin, artistes) ; `label` est annoncé aux lecteurs d'écran.
 */
export function ResultsSkeleton({ label, rows = 4 }: { label: string; rows?: number }) {
  return (
    <div role="status" className="mt-5">
      <span className="sr-only">{label}</span>
      <div aria-hidden="true">
        <div className="flex min-h-11 items-center justify-between gap-3">
          <div className={`h-4 w-24 ${BAR}`} />
          <div className={`h-11 w-28 ${PILL}`} />
        </div>
        <ul className="mt-3 flex flex-col gap-3">
          {Array.from({ length: rows }, (_, i) => (
            <li key={i} className="rounded-lg border border-line-subtle bg-card p-4">
              <div className={`h-5 ${i % 2 ? "w-1/3" : "w-2/5"} ${BAR}`} />
              <div className={`mt-2.5 h-4 ${i % 2 ? "w-2/5" : "w-1/3"} ${BAR}`} />
              <div className={`mt-2 h-3.5 w-1/4 ${BAR}`} />
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

/** Squelette de la barre de recherche, pour l'état de chargement de la page entière. */
export function SearchBarSkeleton() {
  return <div aria-hidden="true" className="h-14 rounded-lg border border-line bg-card" />;
}
