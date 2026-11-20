"use client";

import { CircleCheck } from "lucide-react";
import { useTranslations } from "next-intl";
import { useActionState, useState } from "react";
import { promoteMemberAction } from "@/app/actions/clubs";
import { useActionGuard } from "@/components/system/useActionGuard";
import type { ClubRole } from "@/lib/clubs/membership";
import { BUTTON_PRIMARY, BUTTON_SECONDARY } from "@/components/ui/styles";

const bdi = (chunks: React.ReactNode) => <bdi>{chunks}</bdi>;

/**
 * Action de l'animateur sur la ligne d'un membre : « Donner le rôle d'animateur », avec une confirmation
 * qui dit ce que ce rôle permet. Une fois le rôle donné, la ligne l'annonce (le composant reste monté).
 */
export function MemberActions({
  slug,
  clubName,
  member,
}: {
  slug: string;
  clubName: string;
  member: { id: string; name: string; role: ClubRole };
}) {
  const t = useTranslations("clubs.members");
  const [confirming, setConfirming] = useState(false);
  const { guardState } = useActionGuard();
  const [state, action, pending] = useActionState(guardState(promoteMemberAction.bind(null, slug, member.id)), null);

  if (member.role === "animator") {
    return state?.done ? (
      <p role="status" className="flex items-center gap-1.5 text-sm text-success">
        <CircleCheck aria-hidden="true" className="size-4 shrink-0" />
        <span>{t.rich("promoted", { name: member.name, person: bdi })}</span>
      </p>
    ) : null;
  }

  if (!confirming) {
    return (
      <button
        type="button"
        onClick={() => setConfirming(true)}
        aria-label={t("promoteNamed", { name: member.name })}
        // Bouton discret : il se répète sur chaque ligne, il ne doit pas concurrencer les noms.
        className="-ms-2 inline-flex min-h-11 items-center rounded-md px-2 text-sm font-medium text-link transition-colors duration-(--duration-fast) hover:bg-well"
      >
        {t("promote")}
      </button>
    );
  }

  return (
    <form action={action} className="flex flex-col gap-3 rounded-md bg-well p-3">
      <p className="text-sm">{t.rich("promoteConfirm", { name: member.name, clubName, person: bdi, club: bdi })}</p>
      <div className="flex flex-wrap gap-2">
        <button type="submit" disabled={pending} className={`${BUTTON_PRIMARY} px-4 text-sm`}>
          {t("confirm")}
        </button>
        <button type="button" onClick={() => setConfirming(false)} className={`${BUTTON_SECONDARY} px-4 text-sm`}>
          {t("cancel")}
        </button>
      </div>
    </form>
  );
}
