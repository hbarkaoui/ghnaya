import { Eye } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { restoreSongAction } from "@/app/actions/moderation";
import { BUTTON_SECONDARY } from "@/components/ui/styles";

/**
 * Rétablir une chanson retirée (spec §9, « Réversibilité »), depuis le signalement qui a mené au retrait. Un
 * simple formulaire : l'action serveur vérifie elle-même le droit de modérer.
 */
export async function RestoreSongForm({ reportId }: { reportId: string }) {
  const t = await getTranslations("moderation.report.restore");
  return (
    <section aria-labelledby="retablir" className="rounded-lg border border-line-subtle bg-card p-4">
      <h2 id="retablir" className="text-lg font-medium">
        {t("title")}
      </h2>
      <p className="mt-1 text-ink-2">{t("body")}</p>
      <form action={restoreSongAction.bind(null, reportId)} className="mt-4">
        <button type="submit" className={`${BUTTON_SECONDARY} w-full sm:w-auto`}>
          <Eye aria-hidden="true" className="size-4" />
          {t("button")}
        </button>
      </form>
    </section>
  );
}
