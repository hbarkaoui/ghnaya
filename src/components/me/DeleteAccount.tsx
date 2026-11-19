"use client";

import { Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";
import { useFormStatus } from "react-dom";
import { deleteAccount } from "@/app/actions/account";

/**
 * Suppression du compte en deux temps : le bouton ouvre une confirmation sur place, qui reçoit le focus ;
 * « Annuler » la referme et rend le focus au bouton.
 */
export function DeleteAccount() {
  const t = useTranslations("account");
  const [confirming, setConfirming] = useState(false);
  const trigger = useRef<HTMLButtonElement>(null);
  const heading = useRef<HTMLHeadingElement>(null);
  // Ne déplacer le focus qu'après une action de l'utilisateur, jamais au premier affichage.
  const interacted = useRef(false);

  useEffect(() => {
    if (!interacted.current) return;
    (confirming ? heading : trigger).current?.focus();
  }, [confirming]);

  const toggle = (next: boolean) => {
    interacted.current = true;
    setConfirming(next);
  };

  if (!confirming) {
    return (
      <button
        ref={trigger}
        type="button"
        onClick={() => toggle(true)}
        className="inline-flex min-h-11 items-center gap-2 rounded-md border border-error px-5 font-medium text-error hover:bg-error-soft"
      >
        <Trash2 aria-hidden="true" className="size-4" />
        {t("deleteButton")}
      </button>
    );
  }

  return (
    <div role="group" aria-labelledby="delete-confirm-title" className="rounded-lg border border-error bg-error-soft p-4">
      <h3 id="delete-confirm-title" ref={heading} tabIndex={-1} className="font-medium text-ink">
        {t("confirmTitle")}
      </h3>
      <p className="mt-1 text-ink-2">{t("confirmBody")}</p>
      <form action={deleteAccount} className="mt-4 flex flex-wrap gap-3">
        <ConfirmButton label={t("confirm")} pendingLabel={t("deleting")} />
        <button
          type="button"
          onClick={() => toggle(false)}
          className="inline-flex min-h-11 items-center rounded-md border border-line bg-card px-5 font-medium text-ink hover:bg-well"
        >
          {t("cancel")}
        </button>
      </form>
    </div>
  );
}

function ConfirmButton({ label, pendingLabel }: { label: string; pendingLabel: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex min-h-11 items-center gap-2 rounded-md bg-error px-5 font-medium text-page disabled:opacity-70"
    >
      <Trash2 aria-hidden="true" className="size-4" />
      {pending ? pendingLabel : label}
    </button>
  );
}
