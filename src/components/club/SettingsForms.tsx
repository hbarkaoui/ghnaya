"use client";

import { CircleCheck, RefreshCw, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useActionState, useState, type ReactNode } from "react";
import { deleteClubAction, regenerateInviteAction, renameClubAction, type NameError } from "@/app/actions/clubs";
import { useActionGuard } from "@/components/system/useActionGuard";
import { Bidi } from "@/components/ui/Bidi";
import { CLUB_NAME_MAX, confirmsClubName } from "@/lib/clubs/name";
import {
  BUTTON_DANGER,
  BUTTON_DANGER_OUTLINE,
  BUTTON_PRIMARY,
  BUTTON_SECONDARY,
  FIELD,
  FIELD_ERROR,
  LABEL,
} from "@/components/ui/styles";
import { nameErrorMessage } from "./nameError";

function Saved({ children }: { children: ReactNode }) {
  return (
    <p role="status" className="flex items-center gap-1.5 text-sm text-success">
      <CircleCheck aria-hidden="true" className="size-4 shrink-0" />
      {children}
    </p>
  );
}

/** Renommer le club. Le lien du club (slug) ne change pas. */
export function RenameClubForm({ slug, name }: { slug: string; name: string }) {
  const t = useTranslations("clubs");
  const { guardState } = useActionGuard();
  const [state, action, pending] = useActionState(guardState(renameClubAction.bind(null, slug)), null);
  const error = state?.error as NameError | undefined;

  return (
    <form action={action} className="flex flex-col gap-3">
      <label htmlFor="rename" className={LABEL}>
        {t("settings.renameTitle")}
      </label>
      <input
        id="rename"
        name="name"
        type="text"
        dir="auto"
        required
        maxLength={CLUB_NAME_MAX}
        autoComplete="off"
        defaultValue={name}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? "rename-error" : undefined}
        className={FIELD}
      />
      {error ? (
        <p id="rename-error" className={FIELD_ERROR}>
          {nameErrorMessage(t, error)}
        </p>
      ) : null}
      {state?.done ? <Saved>{t("settings.saved")}</Saved> : null}
      <button type="submit" disabled={pending} className={`${BUTTON_PRIMARY} self-start`}>
        {t("settings.save")}
      </button>
    </form>
  );
}

/** Créer un nouveau lien d'invitation, après confirmation : l'ancien lien ne fonctionnera plus. */
export function RegenerateInviteForm({ slug }: { slug: string }) {
  const t = useTranslations("clubs");
  const [confirming, setConfirming] = useState(false);
  const { guardState } = useActionGuard();
  const [state, action, pending] = useActionState(
    guardState(async () => {
      const result = await regenerateInviteAction(slug);
      setConfirming(false);
      return result;
    }),
    null,
  );

  if (!confirming) {
    return (
      <div className="flex flex-col gap-3">
        {state?.done ? <Saved>{t("settings.regenerated")}</Saved> : null}
        <button type="button" onClick={() => setConfirming(true)} className={`${BUTTON_SECONDARY} self-start`}>
          <RefreshCw aria-hidden="true" className="size-4" />
          {t("settings.regenerate")}
        </button>
      </div>
    );
  }

  return (
    <form action={action} className="flex flex-col gap-3 rounded-md bg-well p-3">
      <p className="text-sm">{t("settings.regenerateConfirm")}</p>
      <div className="flex flex-wrap gap-2">
        <button type="submit" disabled={pending} className={`${BUTTON_PRIMARY} px-4 text-sm`}>
          {t("settings.regenerate")}
        </button>
        <button type="button" onClick={() => setConfirming(false)} className={`${BUTTON_SECONDARY} px-4 text-sm`}>
          {t("members.cancel")}
        </button>
      </div>
    </form>
  );
}

/**
 * Supprimer le club, en retapant son nom (spec §10). Le bouton définitif ne s'active que lorsque le nom
 * correspond ; l'action le revérifie.
 */
export function DeleteClubForm({ slug, name }: { slug: string; name: string }) {
  const t = useTranslations("clubs");
  const [open, setOpen] = useState(false);
  const [typed, setTyped] = useState("");
  const { guardState } = useActionGuard();
  const [state, action, pending] = useActionState(guardState(deleteClubAction.bind(null, slug)), null);
  const matches = confirmsClubName(typed, name);

  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} className={`${BUTTON_DANGER_OUTLINE} self-start`}>
        <Trash2 aria-hidden="true" className="size-4" />
        {t("settings.deleteStart")}
      </button>
    );
  }

  return (
    <form action={action} className="flex flex-col gap-3 rounded-md bg-error-soft p-4">
      <label htmlFor="delete-confirm" className={LABEL}>
        {t.rich("settings.deleteLabel", { name, club: (chunks) => <Bidi className="font-semibold">{chunks}</Bidi> })}
      </label>
      <input
        id="delete-confirm"
        name="confirmName"
        type="text"
        dir="auto"
        autoComplete="off"
        autoCapitalize="none"
        spellCheck={false}
        value={typed}
        onChange={(e) => setTyped(e.target.value)}
        aria-invalid={state?.error ? true : undefined}
        aria-describedby={state?.error ? "delete-error" : undefined}
        className={FIELD}
      />
      {state?.error === "mismatch" ? (
        <p id="delete-error" className={FIELD_ERROR}>
          {t("settings.deleteMismatch", { name })}
        </p>
      ) : null}
      <div className="flex flex-wrap gap-2">
        <button type="submit" disabled={!matches || pending} className={BUTTON_DANGER}>
          <Trash2 aria-hidden="true" className="size-4" />
          {t("settings.deleteSubmit")}
        </button>
        <button
          type="button"
          onClick={() => {
            setOpen(false);
            setTyped("");
          }}
          className={BUTTON_SECONDARY}
        >
          {t("members.cancel")}
        </button>
      </div>
    </form>
  );
}
