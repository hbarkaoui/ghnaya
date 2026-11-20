"use client";

import { Check, CircleAlert, ListMusic, LoaderCircle, Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useId, useRef, useState, type FormEvent } from "react";
import { flushSync } from "react-dom";
import { addSongToPlaylist, createPlaylistWithSong } from "@/app/actions/addToPlaylist";
import { ClubCover } from "@/components/club/ClubCover";
import { Badge } from "@/components/ui/Badge";
import { ACTION_FAILED, useActionGuard } from "@/components/system/useActionGuard";
import { Sheet } from "@/components/ui/Sheet";
import { useToast } from "@/components/ui/Toast";
import { signInHref } from "@/lib/auth/returnPath";
import {
  PLAYLIST_NAME_MAX_LENGTH,
  parsePlaylistName,
  type AddTarget,
  type PlaylistNameError,
} from "@/lib/playlist/addToPlaylist";
import { isolate } from "@/lib/text/isolate";

export type SheetSong = { id: string; titleAr: string | null; titleLatin: string | null };
export type ClubRef = { slug: string; name: string };

type Props = {
  open: boolean;
  onClose: () => void;
  song: SheetSong;
  returnFocus: HTMLElement | null;
  /** Playlists modifiables par l'utilisateur, de la plus récemment modifiée à la plus ancienne. */
  targets: AddTarget[];
  /** Clubs où l'utilisateur peut créer une playlist (ceux qu'il anime) ; vide pour un membre. */
  clubs: ClubRef[];
  onTargetChange: (target: AddTarget) => void;
};

/**
 * Feuille « Ajouter à une playlist » : les playlists que l'utilisateur peut modifier (les siennes et
 * celles des clubs qu'il anime) et « Nouvelle playlist » en création rapide. Un toucher sur une
 * playlist ajoute la chanson, ferme la feuille et confirme par un toast (« Ajoutée à … », ou
 * « Déjà dans … » sans doublon) ; la page d'où l'on vient reste affichée.
 */
export function AddToPlaylistSheet({ open, onClose, song, returnFocus, targets, clubs, onTargetChange }: Props) {
  const t = useTranslations("addToPlaylist");
  return (
    <Sheet
      open={open}
      onClose={onClose}
      title={t("title")}
      description={<SongTitles song={song} />}
      closeLabel={t("close")}
      returnFocus={returnFocus}
    >
      <SheetBody song={song} targets={targets} clubs={clubs} onTargetChange={onTargetChange} onDone={onClose} />
    </Sheet>
  );
}

function SongTitles({ song }: { song: SheetSong }) {
  return (
    <p className="line-clamp-2">
      {song.titleAr ? (
        <span lang="ar" dir="rtl">
          {song.titleAr}
        </span>
      ) : null}
      {song.titleAr && song.titleLatin ? <span aria-hidden="true"> · </span> : null}
      {song.titleLatin ? <span dir="ltr">{song.titleLatin}</span> : null}
    </p>
  );
}

/** Renvoie à la connexion si la session a expiré entre l'ouverture de la page et l'ajout. */
function useSignInRedirect() {
  const router = useRouter();
  return () => router.push(signInHref(window.location.pathname + window.location.search));
}

function SheetBody({
  song,
  targets,
  clubs,
  onTargetChange,
  onDone,
}: Omit<Props, "open" | "onClose" | "returnFocus"> & { onDone: () => void }) {
  const t = useTranslations();
  const toast = useToast();
  const { guard } = useActionGuard();
  const redirectToSignIn = useSignInRedirect();
  // Sans playlist, le formulaire de création est ouvert d'emblée.
  const [creating, setCreating] = useState(targets.length === 0);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const newButtonRef = useRef<HTMLButtonElement>(null);

  async function add(target: AddTarget) {
    if (pendingId) return;
    setPendingId(target.id);
    try {
      const result = await guard(addSongToPlaylist(target.id, song.id));
      // Échec réseau ou serveur : le toast est affiché, la feuille reste ouverte pour réessayer.
      if (result === ACTION_FAILED) return;
      if (result.status === "signedOut") return redirectToSignIn();
      if (result.status === "added" || result.status === "duplicate") {
        onTargetChange(result.target);
        onDone();
        const name = isolate(result.target.name);
        if (result.status === "added") toast(t("addToPlaylist.toast.added", { name }), "success");
        else toast(t("addToPlaylist.toast.duplicate", { name }), "info");
        return;
      }
      // Playlist supprimée ou droits retirés entre-temps : la liste n'est plus à jour.
      onDone();
      toast(t("addToPlaylist.toast.failed"), "error");
    } finally {
      setPendingId(null);
    }
  }

  function cancelCreation() {
    flushSync(() => setCreating(false));
    newButtonRef.current?.focus();
  }

  return (
    <>
      {creating ? (
        <QuickCreate
          song={song}
          clubs={clubs}
          canCancel={targets.length > 0}
          onCancel={cancelCreation}
          onSignedOut={redirectToSignIn}
          onCreated={(target) => {
            onTargetChange(target);
            onDone();
            toast(t("addToPlaylist.toast.addedToNew", { name: isolate(target.name) }), "success");
          }}
        />
      ) : (
        <button
          ref={newButtonRef}
          type="button"
          onClick={() => setCreating(true)}
          className="flex min-h-14 w-full items-center gap-3 rounded-md px-2 py-2 text-start font-medium text-link transition-colors duration-(--duration-fast) hover:bg-well"
        >
          <span
            aria-hidden="true"
            className="inline-flex size-10 shrink-0 items-center justify-center rounded-md border border-dashed border-line"
          >
            <Plus className="size-5" />
          </span>
          {t("addToPlaylist.newPlaylist")}
        </button>
      )}

      {targets.length === 0 ? (
        <p className="mt-3 text-sm text-ink-2">{t("addToPlaylist.empty")}</p>
      ) : (
        <ul aria-label={t("addToPlaylist.listLabel")} aria-busy={pendingId !== null} className="mt-1 flex flex-col">
          {targets.map((target) => {
            const count = target.songIds.length;
            const already = target.songIds.includes(song.id);
            return (
              <li key={target.id}>
                <button
                  type="button"
                  onClick={() => add(target)}
                  // aria-disabled plutôt que disabled : le bouton touché garde le focus pendant l'envoi.
                  aria-disabled={pendingId !== null}
                  className="flex min-h-14 w-full items-center gap-3 rounded-md px-2 py-2 text-start transition-colors duration-(--duration-fast) hover:bg-well aria-disabled:cursor-wait"
                >
                  {target.club ? (
                    <ClubCover name={target.club.name} size="sm" />
                  ) : (
                    <span
                      aria-hidden="true"
                      className="inline-flex size-10 shrink-0 items-center justify-center rounded-md bg-well text-ink-2"
                    >
                      <ListMusic className="size-5" />
                    </span>
                  )}
                  <span className="min-w-0 flex-1">
                    {/* dir="auto" sur un fragment en ligne : un nom latin garde son sens d'écriture, mais la
                        ligne reste alignée sur le début de l'interface (à droite en arabe). */}
                    <span className="line-clamp-2 font-medium">
                      <span dir="auto">{target.name}</span>
                    </span>
                    <span className="block text-sm text-ink-2">
                      <span dir="auto">{target.club ? target.club.name : t("playlists.personal")}</span>
                      <span aria-hidden="true"> · </span>
                      {t("playlists.songCount", { count, n: String(count) })}
                    </span>
                    {/* Sous le nom plutôt qu'en bout de ligne : à 375 px, la ligne club · nombre reste entière. */}
                    {already ? (
                      <Badge tone="success" className="mt-1" icon={<Check aria-hidden="true" className="size-3.5" />}>
                        {t("addToPlaylist.alreadyIn")}
                      </Badge>
                    ) : null}
                  </span>
                  {pendingId === target.id ? (
                    <span className="inline-flex shrink-0 items-center text-ink-2">
                      <LoaderCircle aria-hidden="true" className="size-5 animate-spin motion-reduce:animate-none" />
                      <span className="sr-only">{t("addToPlaylist.adding")}</span>
                    </span>
                  ) : null}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}

/** Valeur de la liste « Ranger dans » pour une playlist personnelle. */
const PERSONAL = "";

/**
 * Création rapide : un nom, et pour un animateur le club où ranger la playlist (son premier club par
 * défaut, ou ses playlists personnelles). La chanson est ajoutée dans la foulée.
 */
function QuickCreate({
  song,
  clubs,
  canCancel,
  onCancel,
  onCreated,
  onSignedOut,
}: {
  song: SheetSong;
  clubs: ClubRef[];
  canCancel: boolean;
  onCancel: () => void;
  onCreated: (target: AddTarget) => void;
  onSignedOut: () => void;
}) {
  const t = useTranslations("addToPlaylist");
  const toast = useToast();
  const { guard } = useActionGuard();
  const [name, setName] = useState("");
  const [destination, setDestination] = useState(clubs[0]?.slug ?? PERSONAL);
  const [error, setError] = useState<PlaylistNameError | null>(null);
  const [pending, setPending] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const nameId = useId();
  const errorId = useId();
  const destinationId = useId();

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;
    const parsed = parsePlaylistName(name);
    if (!parsed.ok) {
      setError(parsed.error);
      inputRef.current?.focus();
      return;
    }
    setPending(true);
    try {
      const result = await guard(
        createPlaylistWithSong({
          name: parsed.name,
          clubSlug: destination === PERSONAL ? null : destination,
          songId: song.id,
        }),
      );
      // Échec réseau ou serveur : toast affiché, le nom saisi reste pour réessayer.
      if (result === ACTION_FAILED) return;
      if (result.status === "created") return onCreated(result.target);
      if (result.status === "invalid") {
        setError(result.error);
        inputRef.current?.focus();
        return;
      }
      if (result.status === "signedOut") return onSignedOut();
      toast(t("toast.failed"), "error");
    } finally {
      setPending(false);
    }
  }

  const field =
    "mt-1.5 h-11 w-full rounded-md border border-line bg-card px-3 text-base text-ink placeholder:text-ink-3";

  return (
    <form onSubmit={submit} noValidate className="rounded-lg border border-line-subtle bg-page p-3">
      <label htmlFor={nameId} className="block text-sm font-medium">
        {t("nameLabel")}
      </label>
      <input
        ref={inputRef}
        id={nameId}
        value={name}
        onChange={(event) => {
          setName(event.target.value);
          if (error) setError(null);
        }}
        placeholder={t("namePlaceholder")}
        dir="auto"
        autoComplete="off"
        enterKeyHint="done"
        autoFocus
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? errorId : undefined}
        className={`${field} aria-invalid:border-error`}
      />
      {error ? (
        <p id={errorId} className="mt-1.5 flex items-start gap-1.5 text-sm text-error">
          <CircleAlert aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
          {t(`errors.${error}`, { max: String(PLAYLIST_NAME_MAX_LENGTH) })}
        </p>
      ) : null}

      {clubs.length > 0 ? (
        <>
          <label htmlFor={destinationId} className="mt-3 block text-sm font-medium">
            {t("destinationLabel")}
          </label>
          <select
            id={destinationId}
            value={destination}
            onChange={(event) => setDestination(event.target.value)}
            className={field}
          >
            {clubs.map((club) => (
              <option key={club.slug} value={club.slug}>
                {club.name}
              </option>
            ))}
            <option value={PERSONAL}>{t("destinationPersonal")}</option>
          </select>
        </>
      ) : null}

      <div className="mt-4 flex flex-wrap justify-end gap-2">
        {canCancel ? (
          <button
            type="button"
            onClick={onCancel}
            className="inline-flex min-h-11 items-center rounded-md px-4 font-medium text-ink transition-colors duration-(--duration-fast) hover:bg-well"
          >
            {t("cancel")}
          </button>
        ) : null}
        <button
          type="submit"
          aria-disabled={pending}
          className="inline-flex min-h-11 items-center gap-2 rounded-md bg-accent px-5 font-medium text-accent-ink transition-colors duration-(--duration-fast) hover:bg-accent-hover aria-disabled:cursor-wait"
        >
          {pending ? <LoaderCircle aria-hidden="true" className="size-4 animate-spin motion-reduce:animate-none" /> : null}
          {pending ? t("creating") : t("create")}
        </button>
      </div>
    </form>
  );
}
