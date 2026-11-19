"use client";

import { LogIn } from "lucide-react";
import { useTranslations } from "next-intl";
import { useActionState } from "react";
import { joinClubAction } from "@/app/actions/clubs";
import { BUTTON_PRIMARY } from "@/components/ui/styles";

/**
 * Bouton « Rejoindre » d'une invitation. `confirm` : le membre a lu « Rejoindre B vous fera quitter A »
 * et confirme le changement de club. L'action revérifie le lien et la règle des clubs.
 */
export function JoinClubForm({ code, label, confirm = false }: { code: string; label: string; confirm?: boolean }) {
  const t = useTranslations("clubs.join");
  const [state, action, pending] = useActionState(joinClubAction.bind(null, code), null);

  return (
    <form action={action} className="flex flex-col gap-3">
      {confirm ? <input type="hidden" name="confirm" value="1" /> : null}
      <button type="submit" disabled={pending} className={`${BUTTON_PRIMARY} w-full`}>
        <LogIn aria-hidden="true" className="size-4 rtl:-scale-x-100" />
        {pending ? t("pending") : label}
      </button>
      {/* Lien régénéré entre l'affichage et le toucher. Les autres cas réaffichent la page (refresh). */}
      {state?.error === "invalid" ? (
        <p role="alert" className="text-sm text-error">
          {t("invalidTitle")}. {t("invalidBody")}
        </p>
      ) : null}
    </form>
  );
}
