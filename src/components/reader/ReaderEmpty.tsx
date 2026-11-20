import { ListMusic, Plus, X } from "lucide-react";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { LogoSymbol } from "@/components/brand/Logo";
import { Bidi } from "@/components/ui/Bidi";

// Mêmes contrôles que le ReaderShell (module client : sa constante n'est pas importable ici).
const CONTROL =
  "inline-flex size-(--size-touch-reader) shrink-0 items-center justify-center rounded-md bg-reader-control text-reader-control-ink transition-colors duration-(--duration-fast) hover:bg-reader-control-pressed focus-visible:outline-reader-focus";

/**
 * Lecteur d'une playlist sans chanson lisible (IA, parcours 1) : plutôt qu'une 404, l'état vide
 * « L'animateur n'a pas encore ajouté de chansons », dans les couleurs du lecteur.
 * Pour qui peut modifier la playlist, l'action est « Ajouter des chansons ».
 */
export async function ReaderEmpty({
  playlist,
  canEdit,
}: {
  playlist: { id: string; name: string };
  canEdit: boolean;
}) {
  const t = await getTranslations();
  const playlistHref = `/playlists/${playlist.id}`;
  const action = canEdit
    ? { href: `/recherche?playlist=${encodeURIComponent(playlist.id)}`, label: t("playlistPage.addSongs"), Icon: Plus, flip: false }
    : { href: playlistHref, label: t("playlistPage.backToPlaylist"), Icon: ListMusic, flip: true };

  return (
    <div data-reader className="fixed inset-0 z-(--z-reader) flex flex-col bg-reader-bg text-reader-ink">
      <header className="shrink-0 px-2 pt-[calc(env(safe-area-inset-top)+0.5rem)] pb-2">
        <div className="mx-auto flex max-w-reader items-center gap-2">
          <Link href={playlistHref} replace aria-label={t("reader.close")} className={CONTROL}>
            <X aria-hidden="true" />
          </Link>
          <p className="line-clamp-2 min-w-0 flex-1 text-center text-sm text-reader-ink-2">
            <Bidi>{playlist.name}</Bidi>
          </p>
          <span aria-hidden="true" className="size-(--size-touch-reader) shrink-0" />
        </div>
      </header>
      <main className="flex min-h-0 flex-1 flex-col items-center justify-center gap-4 overflow-y-auto px-6 pb-16 text-center">
        <LogoSymbol size={72} />
        <h1 className="font-display text-2xl font-semibold text-balance">
          {canEdit ? t("playlistPage.emptyEditableTitle") : t("playlistPage.emptyTitle")}
        </h1>
        <p className="max-w-sm text-pretty text-reader-ink-2">
          {canEdit ? t("playlistPage.emptyEditableBody") : t("playlistPage.emptyBody")}
        </p>
        <Link
          href={action.href}
          replace
          className="mt-2 inline-flex min-h-12 items-center gap-2 rounded-md bg-reader-control-ink px-5 font-medium text-reader-bg focus-visible:outline-reader-focus"
        >
          <action.Icon aria-hidden="true" className={`size-5 ${action.flip ? "rtl:-scale-x-100" : ""}`} />
          {action.label}
        </Link>
      </main>
    </div>
  );
}
