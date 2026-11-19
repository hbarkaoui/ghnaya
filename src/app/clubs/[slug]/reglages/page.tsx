import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { DeleteClubForm, RegenerateInviteForm, RenameClubForm } from "@/components/club/SettingsForms";
import { clubHref } from "@/lib/clubs/href";
import { loadClub } from "../loadClub";

export async function generateMetadata({ params }: PageProps<"/clubs/[slug]/reglages">): Promise<Metadata> {
  const { slug } = await params;
  const [{ club }, t] = await Promise.all([loadClub(slug), getTranslations("clubs.settings")]);
  return { title: `${t("title")} · ${club.name}`, robots: { index: false } };
}

const SECTION = "flex flex-col gap-3 rounded-lg border border-line-subtle bg-card p-4";

/**
 * Sous-onglet Réglages, réservé à l'animateur du club : renommer, créer un nouveau lien d'invitation,
 * supprimer le club en retapant son nom. Un membre qui ouvre cette adresse revient aux playlists.
 */
export default async function ClubSettingsPage({ params }: PageProps<"/clubs/[slug]/reglages">) {
  const { slug } = await params;
  const { club, role } = await loadClub(slug);
  if (role !== "animator") redirect(clubHref(club.slug));
  const t = await getTranslations("clubs.settings");

  return (
    <div className="flex flex-col gap-6">
      <section className={SECTION}>
        <RenameClubForm slug={club.slug} name={club.name} />
      </section>

      <section aria-labelledby="settings-invite" className={SECTION}>
        <h2 id="settings-invite" className="font-medium">
          {t("inviteTitle")}
        </h2>
        <p className="text-ink-2">{t("inviteBody")}</p>
        <p dir="ltr" className="rounded-md bg-well px-3 py-2 font-mono text-sm break-all text-ink-2">
          /rejoindre/{club.inviteCode}
        </p>
        <RegenerateInviteForm slug={club.slug} />
      </section>

      <section aria-labelledby="settings-delete" className="flex flex-col gap-3 rounded-lg border border-error p-4">
        <h2 id="settings-delete" className="font-medium text-error">
          {t("deleteTitle")}
        </h2>
        <p className="text-ink-2">{t("deleteBody")}</p>
        <DeleteClubForm slug={club.slug} name={club.name} />
      </section>
    </div>
  );
}
