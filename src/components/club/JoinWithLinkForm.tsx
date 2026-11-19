"use client";

import { Link2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useActionState } from "react";
import { openInviteLinkAction } from "@/app/actions/clubs";
import { BUTTON_PRIMARY, FIELD, FIELD_ERROR, LABEL } from "@/components/ui/styles";

/** « Rejoindre avec un lien » : coller le lien (ou le message WhatsApp qui le contient), puis ouvrir l'invitation. */
export function JoinWithLinkForm() {
  const t = useTranslations("clubs.noClub");
  const [state, action, pending] = useActionState(openInviteLinkAction, null);
  const invalid = state?.error === "invalid";

  return (
    <form action={action} className="flex w-full flex-col gap-3 text-start">
      <label htmlFor="invite-link" className={LABEL}>
        {t("label")}
      </label>
      <input
        id="invite-link"
        name="link"
        type="text"
        inputMode="url"
        dir="ltr"
        required
        autoComplete="off"
        autoCapitalize="none"
        spellCheck={false}
        placeholder="https://…/rejoindre/…"
        aria-invalid={invalid ? true : undefined}
        aria-describedby={invalid ? "invite-link-error" : undefined}
        className={FIELD}
      />
      {invalid ? (
        <p id="invite-link-error" className={FIELD_ERROR}>
          {t("invalid")}
        </p>
      ) : null}
      <button type="submit" disabled={pending} className={BUTTON_PRIMARY}>
        <Link2 aria-hidden="true" className="size-4" />
        {t("submit")}
      </button>
    </form>
  );
}
