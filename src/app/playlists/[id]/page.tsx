import { ListMusic, MessageSquareText, PencilLine, Play, Plus } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import type { ReactNode } from "react";
import { ClubCover } from "@/components/club/ClubCover";
import { CopyPlaylistButton } from "@/components/playlist/CopyPlaylistButton";
import { PlaylistEditor, type EditorRow } from "@/components/playlist/PlaylistEditor";
import { PlaylistRow } from "@/components/playlist/PlaylistRow";
import { PlaylistSongLabel } from "@/components/playlist/PlaylistSongLabel";
import { PageHeader } from "@/components/shell/PageHeader";
import { PageMain } from "@/components/shell/PageMain";
import { songDisplayTitle } from "@/components/song/songTitle";
import { EmptyState } from "@/components/ui/EmptyState";
import { canCopyPlaylist, canEditPlaylist, canViewPlaylist } from "@/lib/playlist/rights";
import { getCurrentUser } from "@/lib/session";
import { getPlaylist, getRemovedSong, getSong } from "@/mocks/catalog";
import { readerPositionsOf } from "@/mocks/playlistStore";

/** Une playlist n'est visible que par les membres de son club, ou par son propriétaire (spec §10). */
async function findVisiblePlaylist(id: string) {
  const [playlist, user] = [getPlaylist(id), await getCurrentUser()];
  // Tâche 16 : un visiteur passera par /connexion?retour=… (AuthGate) au lieu de la page introuvable.
  return playlist && canViewPlaylist(user, playlist) ? { playlist, user } : null;
}

export async function generateMetadata({ params }: PageProps<"/playlists/[id]">): Promise<Metadata> {
  const { id } = await params;
  const found = await findVisiblePlaylist(id);
  const t = await getTranslations("playlistPage");
  return { title: found ? found.playlist.name : t("metaNotFound"), robots: { index: false } };
}

const SECONDARY =
  "inline-flex min-h-11 items-center gap-2 rounded-md border border-line px-4 font-medium text-ink hover:bg-well";

/**
 * Playlist, personnelle ou de club (IA, « Playlist ») : le nom, le club ou « Personnelle », le nombre de
 * chansons ; « Lire depuis le début » ; la liste numérotée avec les notes, où chaque chanson ouvre le
 * lecteur à sa position. `?edition=1` ouvre le mode édition, pour qui peut modifier la playlist ;
 * un membre qui lit la playlist de son club peut la copier dans ses playlists.
 * Une playlist d'un autre club, ou personnelle d'un autre, est introuvable (not-found.tsx).
 */
export default async function PlaylistPage({ params, searchParams }: PageProps<"/playlists/[id]">) {
  const [{ id }, { edition }] = await Promise.all([params, searchParams]);
  const found = await findVisiblePlaylist(id);
  if (!found) notFound();
  const { playlist, user } = found;

  const [t, locale] = await Promise.all([getTranslations(), getLocale()]);
  const canEdit = canEditPlaylist(user, playlist);
  const editing = canEdit && edition === "1";
  const viewHref = `/playlists/${playlist.id}`;
  const addSongsHref = `/recherche?playlist=${encodeURIComponent(playlist.id)}`;
  const backHref = playlist.club ? `/clubs/${playlist.club.slug}` : "/playlists";

  const positions = readerPositionsOf(playlist);
  const rows = [...playlist.items]
    .sort((a, b) => a.position - b.position)
    .map((item) => ({
      ...item,
      song: getSong(item.songId) ?? getRemovedSong(item.songId) ?? null,
      number: positions.get(item.songId) ?? null,
    }));

  if (editing) {
    const labels: Record<string, ReactNode> = {};
    const editorRows: EditorRow[] = rows.map(({ songId, position, note, song, number }) => {
      labels[songId] = <PlaylistSongLabel song={song} removed={number === null} />;
      const title = song ? songDisplayTitle(song, locale) : "";
      return { songId, position, note, removed: number === null, title: title || t("playlistPage.removed") };
    });
    return (
      <>
        <PageHeader variant="sub" title={t("playlistPage.editor.title")} backHref={viewHref} />
        <PageMain>
          <PlaylistEditor
            playlistId={playlist.id}
            name={playlist.name}
            rows={editorRows}
            labels={labels}
            addSongsHref={addSongsHref}
            viewHref={viewHref}
          />
        </PageMain>
      </>
    );
  }

  const count = positions.size;
  // Copier une playlist vide n'apporterait rien.
  const canCopy = canCopyPlaylist(user, playlist) && rows.length > 0;

  return (
    <>
      <PageHeader variant="sub" backHref={backHref} backToHistory />
      <PageMain>
        <header className="flex items-center gap-4">
          {playlist.club ? (
            <ClubCover name={playlist.club.name} size="md" />
          ) : (
            <span aria-hidden="true" className="inline-flex size-16 shrink-0 items-center justify-center rounded-lg bg-well text-ink-2">
              <ListMusic className="size-7" />
            </span>
          )}
          <div className="min-w-0 flex-1">
            {/* Le sens d'écriture est sur le fragment : le titre reste aligné sur l'interface (à droite en arabe). */}
            <h1 className="font-display text-2xl leading-snug font-semibold text-balance">
              <span dir="auto">{playlist.name}</span>
            </h1>
            <p className="mt-0.5 text-ink-2">
              <span dir="auto">{playlist.club ? playlist.club.name : t("playlists.personal")}</span>
              <span aria-hidden="true"> · </span>
              {t("playlists.songCount", { count, n: String(count) })}
            </p>
          </div>
        </header>

        {count > 0 || canEdit || canCopy ? (
          <div className="mt-5 flex flex-col gap-3">
            {count > 0 ? (
              <Link
                href={`/lecture/${playlist.id}/1`}
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-md bg-accent px-5 font-medium text-accent-ink transition-colors duration-(--duration-fast) hover:bg-accent-hover"
              >
                <Play aria-hidden="true" className="size-5 rtl:-scale-x-100" />
                {t("playlistPage.readFromStart")}
              </Link>
            ) : null}
            {canEdit ? (
              <div>
                <Link href={`${viewHref}?edition=1`} replace scroll={false} className={SECONDARY}>
                  <PencilLine aria-hidden="true" className="size-4" />
                  {t("playlistPage.edit")}
                </Link>
              </div>
            ) : null}
            {canCopy ? <CopyPlaylistButton playlistId={playlist.id} /> : null}
          </div>
        ) : null}

        <section aria-labelledby="playlist-songs" className="mt-6">
          <h2 id="playlist-songs" className="sr-only">
            {t("playlistPage.songsTitle")}
          </h2>
          {rows.length === 0 ? (
            canEdit ? (
              <EmptyState
                title={t("playlistPage.emptyEditableTitle")}
                body={t("playlistPage.emptyEditableBody")}
                action={{ label: t("playlistPage.addSongs"), href: addSongsHref, icon: <Plus aria-hidden="true" className="size-4" /> }}
              />
            ) : (
              <EmptyState title={t("playlistPage.emptyTitle")} body={t("playlistPage.emptyBody")} />
            )
          ) : (
            <ol className="flex flex-col gap-2">
              {rows.map(({ songId, note, song, number }) => (
                <PlaylistRow
                  key={songId}
                  number={number}
                  href={number === null ? undefined : `/lecture/${playlist.id}/${number}`}
                  label={<PlaylistSongLabel song={song} removed={number === null} />}
                  note={
                    note && number !== null ? (
                      <p className="flex items-start gap-1.5 text-sm text-ink-2">
                        <MessageSquareText aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
                        <span>
                          <span className="sr-only">{t("playlistPage.noteLabel")} </span>
                          <span dir="auto">{note}</span>
                        </span>
                      </p>
                    ) : undefined
                  }
                />
              ))}
            </ol>
          )}
        </section>
      </PageMain>
    </>
  );
}
