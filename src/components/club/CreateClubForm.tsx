"use client";

import { Plus } from "lucide-react";
import { useTranslations } from "next-intl";
import { useActionState, useState } from "react";
import { createClubAction, type NameError } from "@/app/actions/clubs";
import { useActionGuard } from "@/components/system/useActionGuard";
import { CLUB_NAME_MAX } from "@/lib/clubs/name";
import { BUTTON_PRIMARY, FIELD, FIELD_ERROR, FIELD_HINT, LABEL } from "@/components/ui/styles";
import { ClubCover } from "./ClubCover";
import { nameErrorMessage } from "./nameError";

/** Création d'un club : le nom, avec l'aperçu de la couverture générée à partir de ce nom. */
export function CreateClubForm() {
  const t = useTranslations("clubs");
  const { guardState } = useActionGuard();
  const [state, action, pending] = useActionState(guardState(createClubAction), null);
  const [name, setName] = useState("");
  const error = state?.error as NameError | undefined;
  const preview = name.trim();

  return (
    <form action={action} className="flex flex-col gap-5">
      {preview ? (
        <ClubCover name={preview} size="lg" />
      ) : (
        <div aria-hidden="true" className="h-28 rounded-xl border border-dashed border-line bg-well" />
      )}
      <div>
        <label htmlFor="club-name" className={LABEL}>
          {t("new.nameLabel")}
        </label>
        <input
          id="club-name"
          name="name"
          type="text"
          dir="auto"
          required
          maxLength={CLUB_NAME_MAX}
          autoComplete="off"
          value={name}
          onChange={(e) => setName(e.target.value)}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? "club-name-error club-name-hint" : "club-name-hint"}
          className={`mt-2 ${FIELD}`}
        />
        {error ? (
          <p id="club-name-error" className={FIELD_ERROR}>
            {nameErrorMessage(t, error)}
          </p>
        ) : null}
        <p id="club-name-hint" className={FIELD_HINT}>
          {t("new.nameHint")}
        </p>
      </div>
      <button type="submit" disabled={pending} className={BUTTON_PRIMARY}>
        <Plus aria-hidden="true" className="size-4" />
        {t("new.submit")}
      </button>
    </form>
  );
}
