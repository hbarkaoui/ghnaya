"use client";

import { Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useActionState, useState } from "react";
import { deletePlaylistAction } from "@/app/actions/playlist";
import { useActionGuard } from "@/components/system/useActionGuard";
import { BUTTON_DANGER, BUTTON_DANGER_OUTLINE, BUTTON_SECONDARY } from "@/components/ui/styles";

/** Supprimer la playlist, en deux temps : le bouton ouvre une confirmation. */
export function DeletePlaylistForm({ playlistId }: { playlistId: string }) {
  const t = useTranslations("playlistPage.editor");
  const [open, setOpen] = useState(false);
  const { guardState } = useActionGuard();
  const [, action, pending] = useActionState(guardState(deletePlaylistAction.bind(null, playlistId)), null);

  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} className={`${BUTTON_DANGER_OUTLINE} self-start`}>
        <Trash2 aria-hidden="true" className="size-4" />
        {t("deleteStart")}
      </button>
    );
  }

  return (
    <form action={action} className="flex flex-col gap-3 rounded-md bg-error-soft p-4">
      <p>{t("deleteBody")}</p>
      <div className="flex flex-wrap gap-2">
        <button type="submit" disabled={pending} className={BUTTON_DANGER}>
          <Trash2 aria-hidden="true" className="size-4" />
          {t("deleteConfirm")}
        </button>
        <button type="button" onClick={() => setOpen(false)} className={BUTTON_SECONDARY}>
          {t("deleteCancel")}
        </button>
      </div>
    </form>
  );
}
