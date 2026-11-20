import { LoadingStatus, SkeletonBar, SkeletonRows } from "@/components/ui/Skeleton";

/**
 * Squelette de la liste de résultats, pendant la recherche. Il reprend la forme d'un SongResultItem
 * (titre, titre latin, artistes) ; `label` est annoncé aux lecteurs d'écran.
 */
export function ResultsSkeleton({ label, rows = 4 }: { label: string; rows?: number }) {
  return (
    <LoadingStatus label={label} className="mt-5">
      <div className="flex min-h-11 items-center justify-between gap-3">
        <SkeletonBar className="h-4 w-24" />
        <SkeletonBar className="h-11 w-28 rounded-full" />
      </div>
      <div className="mt-3">
        <SkeletonRows rows={rows} lines={3} />
      </div>
    </LoadingStatus>
  );
}

/** Squelette de la barre de recherche, pour l'état de chargement de la page entière. */
export function SearchBarSkeleton() {
  return <div aria-hidden="true" className="h-14 rounded-lg border border-line bg-card" />;
}
