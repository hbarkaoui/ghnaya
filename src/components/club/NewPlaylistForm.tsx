"use client";

import { Plus } from "lucide-react";
import { useTranslations } from "next-intl";
import { useActionState, useState } from "react";
import { createClubPlaylistAction, type FormState, type NameError } from "@/app/actions/clubs";
import { CLUB_NAME_MAX } from "@/lib/clubs/name";
import { StatusNotice } from "@/components/ui/StatusNotice";
import { BUTTON_PRIMARY, BUTTON_SECONDARY, FIELD, FIELD_ERROR, LABEL } from "@/components/ui/styles";
import { nameErrorMessage } from "./nameError";

/**
 * « Nouvelle playlist » d'un club, pour son animateur : un bouton qui ouvre un petit formulaire (le nom).
 * La playlist créée apparaît en tête de la liste ; on l'ouvre ensuite pour ajouter des chansons.
 */
export function NewPlaylistForm({ slug }: { slug: string }) {
  const t = useTranslations("clubs");
  const [open, setOpen] = useState(false);
  const [state, action, pending] = useActionState(async (prev: FormState, formData: FormData) => {
    const result = await createClubPlaylistAction(slug, prev, formData);
    if (result?.done) setOpen(false);
    return result;
  }, null);
  const error = state?.error as NameError | undefined;

  if (!open) {
    return (
      <div className="flex flex-col gap-3">
        {state?.done ? <StatusNotice>{t("playlists.created", { name: state.done })}</StatusNotice> : null}
        <button type="button" onClick={() => setOpen(true)} className={`${BUTTON_SECONDARY} self-start`}>
          <Plus aria-hidden="true" className="size-4" />
          {t("playlists.new")}
        </button>
      </div>
    );
  }

  return (
    <form action={action} className="flex flex-col gap-3 rounded-lg border border-line-subtle bg-card p-4">
      <label htmlFor="playlist-name" className={LABEL}>
        {t("playlists.nameLabel")}
      </label>
      <input
        id="playlist-name"
        name="name"
        type="text"
        dir="auto"
        required
        autoFocus
        maxLength={CLUB_NAME_MAX}
        autoComplete="off"
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? "playlist-name-error" : undefined}
        className={FIELD}
      />
      {error ? (
        <p id="playlist-name-error" className={FIELD_ERROR}>
          {nameErrorMessage(t, error)}
        </p>
      ) : null}
      <div className="flex flex-wrap gap-3">
        <button type="submit" disabled={pending} className={BUTTON_PRIMARY}>
          {t("playlists.create")}
        </button>
        <button type="button" onClick={() => setOpen(false)} className={BUTTON_SECONDARY}>
          {t("playlists.cancel")}
        </button>
      </div>
    </form>
  );
}
