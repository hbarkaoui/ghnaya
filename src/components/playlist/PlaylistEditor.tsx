"use client";

import { ArrowDown, ArrowUp, Check, Plus, X } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { startTransition, useId, useLayoutEffect, useOptimistic, useRef, useState, type ReactNode } from "react";
import {
  movePlaylistSong,
  removePlaylistSong,
  renamePlaylist,
  restorePlaylistSong,
  savePlaylistNote,
} from "@/app/actions/playlist";
import { ACTION_FAILED, useActionGuard } from "@/components/system/useActionGuard";
import { EmptyState } from "@/components/ui/EmptyState";
import {
  NAME_MAX_LENGTH,
  NOTE_MAX_LENGTH,
  insertItem,
  moveItem,
  normalizeNote,
  normalizePlaylistName,
  removeItem,
  type Direction,
} from "@/lib/playlist/edit";
import { PlaylistRow } from "./PlaylistRow";

/** Une ligne de l'éditeur : la chanson, sa position, sa note, et son titre en texte simple (libellés des boutons). */
export interface EditorRow {
  songId: string;
  position: number;
  note: string | null;
  /** Chanson retirée de la base : pas de numéro, pas de note, mais on peut la déplacer ou la retirer. */
  removed: boolean;
  title: string;
}

type Op =
  | { type: "move"; songId: string; direction: Direction }
  | { type: "remove"; songId: string }
  | { type: "restore"; row: EditorRow };

function applyOp(rows: EditorRow[], op: Op): EditorRow[] {
  if (op.type === "move") return moveItem(rows, op.songId, op.direction);
  if (op.type === "remove") return removeItem(rows, op.songId);
  return insertItem(rows, op.row);
}

type Control = "up" | "down" | "remove";

/** Isole un titre dans une phrase de l'autre sens d'écriture (FSI … PDI). */
const isolate = (text: string) => `⁨${text}⁩`;

const ICON_BUTTON =
  "inline-flex size-11 items-center justify-center rounded-md text-ink-2 transition-colors duration-(--duration-fast) hover:bg-well hover:text-ink disabled:pointer-events-none disabled:opacity-30";
// unicode-bidi: plaintext : le sens suit le texte saisi (arabe ou latin), et un champ vide garde celui
// de l'interface (avec dir="auto", un champ vide passerait de gauche à droite, texte indicatif compris).
const FIELD =
  "h-11 w-full rounded-md border border-line bg-well px-3 text-base text-ink [unicode-bidi:plaintext] placeholder:text-ink-3 aria-invalid:border-error";

/**
 * Mode édition d'une playlist (IA, parcours 3) : renommage, ↑ / ↓, note écrite dans la ligne, retrait
 * avec « Annuler », « Ajouter des chansons », puis « Terminer ».
 *
 * Chaque modification part aussitôt au serveur (actions de app/actions/playlist) ; l'ordre affiché suit
 * le geste sans attendre la réponse (useOptimistic). Après un déplacement, le focus reste sur le bouton
 * utilisé ; après un retrait, il passe sur « Annuler », à la place de la ligne. Les changements sont
 * annoncés aux lecteurs d'écran.
 *
 * Un enregistrement qui échoue (réseau coupé, serveur injoignable) affiche un toast d'erreur : l'ordre
 * revient de lui-même à celui du serveur (fin de la transition optimiste), une ligne retirée revient,
 * « Annuler » réapparaît si c'est lui qui a échoué, et une note ou un nom restent dans leur champ.
 */
export function PlaylistEditor({
  playlistId,
  name,
  rows,
  labels,
  addSongsHref,
  viewHref,
}: {
  playlistId: string;
  name: string;
  rows: EditorRow[];
  /** Étiquettes rendues par le serveur (titres et artistes balisés), par chanson. */
  labels: Record<string, ReactNode>;
  addSongsHref: string;
  viewHref: string;
}) {
  const t = useTranslations("playlistPage");
  const tEditor = useTranslations("playlistPage.editor");
  const router = useRouter();
  const { guard } = useActionGuard();
  const nameErrorId = useId();

  const [optimisticRows, apply] = useOptimistic(rows, applyOp);
  const [lastRemoved, setLastRemoved] = useState<{ row: EditorRow; index: number; label: ReactNode } | null>(null);
  // Étiquette d'une chanson remise après « Annuler », le temps que le serveur renvoie la playlist.
  const [restoredLabels, setRestoredLabels] = useState<Record<string, ReactNode>>({});
  const [announcement, setAnnouncement] = useState("");
  const [nameError, setNameError] = useState(false);
  const [finishing, setFinishing] = useState(false);

  const listRef = useRef<HTMLOListElement>(null);
  const nameRef = useRef<HTMLInputElement>(null);
  const undoRef = useRef<HTMLButtonElement>(null);
  const pendingFocus = useRef<{ songId: string; control: Control } | "undo" | null>(null);
  const inflight = useRef(new Set<Promise<unknown>>());

  /** Garde la trace des enregistrements en cours, pour que « Terminer » les attende. */
  function track<T>(promise: Promise<T>): Promise<T> {
    inflight.current.add(promise);
    const done = () => inflight.current.delete(promise);
    promise.then(done, done);
    return promise;
  }

  // Après un déplacement ou un retrait, rendre le focus au bon bouton (le nœud a pu changer de place).
  // Si la cible n'est pas encore là (ligne remise après un échec, à la fin de la transition), on
  // réessaie au rendu suivant.
  useLayoutEffect(() => {
    const target = pendingFocus.current;
    if (!target) return;
    if (target === "undo") {
      if (!undoRef.current) return;
      pendingFocus.current = null;
      undoRef.current.focus();
      return;
    }
    const find = (control: Control) =>
      listRef.current?.querySelector<HTMLButtonElement>(
        `[data-song="${CSS.escape(target.songId)}"][data-control="${control}"]`,
      );
    const button = find(target.control);
    const fallback = target.control === "up" ? find("down") : find("up");
    const next = button && !button.disabled ? button : fallback;
    if (!next) return;
    pendingFocus.current = null;
    next.focus();
  });

  function move(row: EditorRow, index: number, direction: Direction) {
    const position = direction === "up" ? index : index + 2;
    pendingFocus.current = { songId: row.songId, control: direction };
    setLastRemoved(null);
    setAnnouncement(
      tEditor("moved", { title: row.title, position: String(position), total: String(optimisticRows.length) }),
    );
    startTransition(async () => {
      apply({ type: "move", songId: row.songId, direction });
      await track(guard(movePlaylistSong(playlistId, row.songId, direction)));
    });
  }

  function remove(row: EditorRow, index: number) {
    pendingFocus.current = "undo";
    setLastRemoved({ row, index, label: labels[row.songId] ?? restoredLabels[row.songId] });
    setAnnouncement(tEditor("removedRow", { title: row.title }));
    startTransition(async () => {
      apply({ type: "remove", songId: row.songId });
      const result = await track(guard(removePlaylistSong(playlistId, row.songId)));
      if (result === ACTION_FAILED) {
        // La ligne revient : plus rien à annuler, le focus retourne sur son bouton de retrait.
        pendingFocus.current = { songId: row.songId, control: "remove" };
        setLastRemoved(null);
      }
    });
  }

  function undo() {
    if (!lastRemoved) return;
    const removed = lastRemoved;
    const { row, label } = removed;
    pendingFocus.current = { songId: row.songId, control: "remove" };
    setLastRemoved(null);
    setRestoredLabels((current) => ({ ...current, [row.songId]: label }));
    setAnnouncement(tEditor("restored", { title: row.title }));
    startTransition(async () => {
      apply({ type: "restore", row });
      const result = await track(
        guard(restorePlaylistSong(playlistId, { songId: row.songId, position: row.position, note: row.note })),
      );
      if (result === ACTION_FAILED) {
        // La chanson reste retirée : « Annuler » revient, pour réessayer.
        pendingFocus.current = "undo";
        setLastRemoved(removed);
      }
    });
  }

  async function saveNote(row: EditorRow, value: string) {
    if (normalizeNote(value) === row.note) return;
    // Après un échec, la note reste dans son champ : la quitter à nouveau réessaie.
    const result = await track(guard(savePlaylistNote(playlistId, row.songId, value)));
    if (result === ACTION_FAILED) return;
    setAnnouncement(tEditor("noteSaved", { title: row.title }));
  }

  // L'erreur s'affiche en quittant le champ et s'efface dès la saisie (onChange), jamais au moment
  // de quitter le champ : sinon la page remonterait sous le doigt qui touche « Terminer ».
  async function saveName(value: string) {
    const next = normalizePlaylistName(value);
    if (next === null) setNameError(true);
    if (next === null || next === name) return;
    const result = await track(guard(renamePlaylist(playlistId, value)));
    if (result === ACTION_FAILED) return;
    if (result.ok) setAnnouncement(tEditor("renamed", { name: result.name }));
    else setNameError(result.error === "empty");
  }

  /** « Terminer » : attendre les enregistrements en cours (la note quittée à l'instant), puis revenir à la playlist. */
  async function finish() {
    if (normalizePlaylistName(nameRef.current?.value ?? "") === null) {
      setNameError(true);
      nameRef.current?.focus();
      return;
    }
    setFinishing(true);
    await Promise.allSettled([...inflight.current]);
    router.replace(viewHref, { scroll: false });
  }

  const doneButton = (className: string) => (
    <button
      type="button"
      onClick={finish}
      disabled={finishing}
      className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-md bg-accent px-5 font-medium text-accent-ink hover:bg-accent-hover disabled:opacity-60 ${className}`}
    >
      <Check aria-hidden="true" className="size-4" />
      {tEditor("done")}
    </button>
  );

  // Numéros du lecteur : les chansons retirées n'en ont pas (lib/playlist/rows, readablePositions).
  let readable = 0;
  const numbered = optimisticRows.map((row) => ({ row, number: row.removed ? null : ++readable }));
  const undoIndex = lastRemoved ? Math.min(lastRemoved.index, optimisticRows.length) : -1;

  const undoRow = lastRemoved ? (
    <li
      key="undo"
      className="flex items-center justify-between gap-3 rounded-lg border border-dashed border-line px-4 py-1 text-sm text-ink-2"
    >
      <span>{tEditor("removedRow", { title: isolate(lastRemoved.row.title) })}</span>
      <button
        ref={undoRef}
        type="button"
        onClick={undo}
        className="min-h-11 shrink-0 rounded-md px-3 font-medium text-link underline-offset-4 hover:underline"
      >
        {tEditor("undo")}
      </button>
    </li>
  ) : null;

  return (
    <div>
      <form
        onSubmit={(event) => {
          event.preventDefault();
          void saveName(nameRef.current?.value ?? "");
        }}
      >
        <label htmlFor="playlist-name" className="mb-1.5 block font-medium">
          {tEditor("nameLabel")}
        </label>
        <input
          ref={nameRef}
          id="playlist-name"
          name="name"
          defaultValue={name}
          maxLength={NAME_MAX_LENGTH}
          autoComplete="off"
          enterKeyHint="done"
          aria-invalid={nameError || undefined}
          aria-describedby={nameError ? nameErrorId : undefined}
          onChange={(event) => {
            if (nameError && normalizePlaylistName(event.currentTarget.value) !== null) setNameError(false);
          }}
          onBlur={(event) => void saveName(event.currentTarget.value)}
          className={FIELD}
        />
        {nameError ? (
          <p id={nameErrorId} className="mt-1.5 text-sm text-error">
            {tEditor("nameEmpty")}
          </p>
        ) : null}
      </form>
      <p className="mt-3 text-sm text-ink-2">{tEditor("hint")}</p>

      <div className="mt-4 flex flex-wrap gap-3">
        <Link
          href={addSongsHref}
          className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-md border border-line px-4 text-center font-medium text-ink hover:bg-well"
        >
          <Plus aria-hidden="true" className="size-4" />
          {t("addSongs")}
        </Link>
        {doneButton("flex-1")}
      </div>

      <section aria-labelledby="playlist-songs" className="mt-6">
        <h2 id="playlist-songs" className="sr-only">
          {t("songsTitle")}
        </h2>
        {optimisticRows.length === 0 && !lastRemoved ? (
          <EmptyState title={t("emptyEditableTitle")} body={t("emptyEditableBody")} />
        ) : (
          <ol ref={listRef} className="flex flex-col gap-2">
            {numbered.flatMap(({ row, number }, index) => {
              const item = (
                <PlaylistRow
                  key={row.songId}
                  number={number}
                  label={labels[row.songId] ?? restoredLabels[row.songId]}
                  note={
                    row.removed ? undefined : (
                      // Une zone de texte qui grandit avec la note (field-sizing), pour la lire en entier ;
                      // la note reste sur une ligne logique : Entrée l'enregistre au lieu d'aller à la ligne.
                      <textarea
                        rows={1}
                        defaultValue={row.note ?? ""}
                        maxLength={NOTE_MAX_LENGTH}
                        autoComplete="off"
                        enterKeyHint="done"
                        aria-label={tEditor("noteFor", { title: row.title })}
                        placeholder={tEditor("notePlaceholder")}
                        onBlur={(event) => void saveNote(row, event.currentTarget.value)}
                        onKeyDown={(event) => {
                          if (event.key === "Enter") {
                            event.preventDefault();
                            event.currentTarget.blur();
                          }
                        }}
                        className={`${FIELD} block h-auto min-h-11 resize-none py-2 field-sizing-content`}
                      />
                    )
                  }
                  actions={
                    <>
                      <button
                        type="button"
                        data-song={row.songId}
                        data-control="up"
                        onClick={() => move(row, index, "up")}
                        disabled={index === 0}
                        aria-label={tEditor("moveUp", { title: row.title })}
                        className={ICON_BUTTON}
                      >
                        <ArrowUp aria-hidden="true" className="size-5" />
                      </button>
                      <button
                        type="button"
                        data-song={row.songId}
                        data-control="down"
                        onClick={() => move(row, index, "down")}
                        disabled={index === optimisticRows.length - 1}
                        aria-label={tEditor("moveDown", { title: row.title })}
                        className={ICON_BUTTON}
                      >
                        <ArrowDown aria-hidden="true" className="size-5" />
                      </button>
                      <button
                        type="button"
                        data-song={row.songId}
                        data-control="remove"
                        onClick={() => remove(row, index)}
                        aria-label={tEditor("remove", { title: row.title })}
                        className={`${ICON_BUTTON} hover:text-error`}
                      >
                        <X aria-hidden="true" className="size-5" />
                      </button>
                    </>
                  }
                />
              );
              return index === undoIndex ? [undoRow, item] : [item];
            })}
            {undoIndex === optimisticRows.length ? undoRow : null}
          </ol>
        )}
      </section>

      {optimisticRows.length > 3 ? <div className="mt-6 flex">{doneButton("flex-1")}</div> : null}

      <p aria-live="polite" className="sr-only">
        {announcement}
      </p>
    </div>
  );
}
