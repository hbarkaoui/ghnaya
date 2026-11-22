"use client";

import { useTranslations } from "next-intl";
import { useActionState, useState } from "react";
import { renameUserAction, type NameState } from "@/app/actions/account";
import { useActionGuard } from "@/components/system/useActionGuard";
import { Bidi } from "@/components/ui/Bidi";
import { BUTTON_PRIMARY, BUTTON_SECONDARY, FIELD, FIELD_ERROR, FIELD_HINT } from "@/components/ui/styles";
import { USER_NAME_MAX } from "@/lib/auth/name";

/** Ligne « Nom » du compte : le nom, et « Modifier » qui ouvre le champ en place. */
export function NameForm({ name }: { name: string }) {
  const t = useTranslations("account");
  const [editing, setEditing] = useState(false);
  const { guardState } = useActionGuard();
  const [state, action, pending] = useActionState<NameState, FormData>(
    guardState(async (prev: NameState, formData: FormData) => {
      const next = await renameUserAction(prev, formData);
      if (next?.done) setEditing(false);
      return next;
    }),
    null,
  );
  const shown = state?.done ?? name;

  if (!editing) {
    return (
      <div className="flex items-center justify-between gap-3">
        <span className="font-medium">
          <Bidi>{shown}</Bidi>
          {state?.done ? <span role="status" className="sr-only"> {t("nameSaved")}</span> : null}
        </span>
        <button type="button" onClick={() => setEditing(true)} className="min-h-11 rounded-md px-3 font-medium text-link">
          {t("editName")}
        </button>
      </div>
    );
  }

  const error = state?.error === "required" ? t("nameRequired") : state?.error === "tooLong" ? t("nameTooLong") : null;
  return (
    <form action={action} className="flex flex-col gap-2">
      <input
        name="name"
        defaultValue={shown}
        dir="auto"
        autoComplete="name"
        maxLength={USER_NAME_MAX + 10}
        aria-label={t("name")}
        aria-invalid={error ? true : undefined}
        aria-describedby="name-hint"
        className={FIELD}
      />
      <p id="name-hint" className={error ? FIELD_ERROR : FIELD_HINT}>
        {error ?? t("nameHint")}
      </p>
      <div className="flex gap-2">
        <button type="submit" disabled={pending} className={BUTTON_PRIMARY}>
          {t("nameSave")}
        </button>
        <button type="button" onClick={() => setEditing(false)} className={BUTTON_SECONDARY}>
          {t("nameCancel")}
        </button>
      </div>
    </form>
  );
}
