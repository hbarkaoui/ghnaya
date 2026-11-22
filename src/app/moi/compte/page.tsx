import { TriangleAlert } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { ClubCover } from "@/components/club/ClubCover";
import { DeleteAccount } from "@/components/me/DeleteAccount";
import { SignInInvite } from "@/components/me/SignInInvite";
import { LocaleSwitcher } from "@/components/shell/LocaleSwitcher";
import { PageHeader } from "@/components/shell/PageHeader";
import { PageMain } from "@/components/shell/PageMain";
import { Bidi } from "@/components/ui/Bidi";
import { getCurrentUser } from "@/lib/session";
import { soleAnimatorClubs } from "@/lib/clubs/queries";
import type { ClubRef } from "@/lib/clubs/types";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("account");
  return { title: t("title") };
}

/** Compte : nom, e-mail, langue, puis la suppression du compte (spec §12). */
export default async function AccountPage() {
  const t = await getTranslations("account");
  const tMe = await getTranslations("me");
  const user = await getCurrentUser();

  if (!user) {
    return (
      <>
        <PageHeader variant="sub" title={t("title")} backHref="/moi" />
        <PageMain>
          <SignInInvite title={tMe("visitorTitle")} body={t("visitorBody")} retour="/moi/compte" />
        </PageMain>
      </>
    );
  }

  const { email } = user;
  const blockingClubs = await soleAnimatorClubs(user.id);

  return (
    <>
      <PageHeader variant="sub" title={t("title")} backHref="/moi" />
      <PageMain>
        <section aria-labelledby="account-info">
          <h2 id="account-info" className="mb-3 text-lg font-medium">
            {t("infoTitle")}
          </h2>
          <dl className="divide-y divide-line-subtle rounded-lg border border-line-subtle bg-card">
            <div className="flex min-h-14 flex-col justify-center px-4 py-2">
              <dt className="text-sm text-ink-2">{t("name")}</dt>
              <dd className="font-medium">
                <Bidi>{user.name}</Bidi>
              </dd>
            </div>
            <div className="flex min-h-14 flex-col justify-center px-4 py-2">
              <dt className="text-sm text-ink-2">{t("email")}</dt>
              <dd className="font-medium break-all">
                {/* Fragment latin : de gauche à droite, même dans l'interface arabe (alignée à droite). */}
                <span dir="ltr">{email}</span>
              </dd>
            </div>
            <div className="flex min-h-14 items-center justify-between gap-3 px-4 py-2">
              <dt className="text-sm text-ink-2">{t("language")}</dt>
              <dd>
                <LocaleSwitcher />
              </dd>
            </div>
          </dl>
        </section>

        <section aria-labelledby="account-delete" className="mt-10">
          <h2 id="account-delete" className="text-lg font-medium">
            {t("deleteTitle")}
          </h2>
          <p className="mt-2 mb-4 text-ink-2 text-pretty">{t("deleteBody", { clubs: user.clubSlugs.length })}</p>
          {blockingClubs.length > 0 ? <LastAnimatorNotice clubs={blockingClubs} /> : <DeleteAccount />}
        </section>
      </PageMain>
    </>
  );
}

/**
 * Règle du dernier animateur (spec §12) : tant qu'un club n'a pas d'autre animateur, la suppression
 * n'est pas proposée ; on mène vers les membres (désigner un animateur) ou les réglages (supprimer le club).
 */
async function LastAnimatorNotice({ clubs }: { clubs: ClubRef[] }) {
  const t = await getTranslations("account");
  const linkClass =
    "inline-flex min-h-11 items-center rounded-md border border-line bg-card px-4 text-sm font-medium text-ink hover:bg-well";

  return (
    <div className="rounded-lg border border-warning bg-warning-soft p-4">
      <p className="flex items-start gap-2 font-medium text-warning">
        <TriangleAlert aria-hidden="true" className="mt-0.5 size-5 shrink-0" />
        {t("blockedTitle", { count: clubs.length })}
      </p>
      <p className="mt-1 text-ink text-pretty">{t("blockedBody", { count: clubs.length })}</p>
      <ul className="mt-4 flex flex-col gap-4">
        {clubs.map((club) => (
          <li key={club.slug} className="flex flex-col gap-2">
            <span className="flex items-center gap-2.5 font-medium">
              <ClubCover name={club.name} size="sm" />
              <Bidi>{club.name}</Bidi>
            </span>
            <span className="flex flex-wrap gap-2">
              <Link href={`/clubs/${club.slug}/membres`} className={linkClass}>
                {t("designate")}
              </Link>
              <Link href={`/clubs/${club.slug}/reglages`} className={linkClass}>
                {t("deleteClub")}
              </Link>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
