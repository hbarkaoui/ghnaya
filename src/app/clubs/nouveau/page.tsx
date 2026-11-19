import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { CreateClubForm } from "@/components/club/CreateClubForm";
import { PageHeader } from "@/components/shell/PageHeader";
import { PageMain } from "@/components/shell/PageMain";
import { EmptyState } from "@/components/ui/EmptyState";
import { signInHref } from "@/lib/clubs/href";
import { getCurrentUser } from "@/lib/session";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("clubs.new");
  return { title: t("title"), robots: { index: false } };
}

/**
 * Créer un club : réservé aux animateurs (rôle attribué par un admin, spec §4.3).
 * Un membre qui ouvre cette adresse lit pourquoi, et comment rejoindre un club.
 */
export default async function NewClubPage() {
  const user = await getCurrentUser();
  if (!user) redirect(signInHref("/clubs/nouveau"));
  const t = await getTranslations("clubs");

  if (!user.isAnimator) {
    return (
      <>
        <PageHeader variant="sub" backHref="/clubs" />
        <PageMain>
          <EmptyState
            titleAs="h1"
            title={t("new.forbiddenTitle")}
            body={t("new.forbiddenBody")}
            action={
              user.clubSlugs.length > 0
                ? { label: t("new.backToClub"), href: "/clubs" }
                : { label: t("noClub.submit"), href: "/clubs" }
            }
          />
        </PageMain>
      </>
    );
  }

  return (
    <>
      <PageHeader variant="sub" title={t("new.title")} backHref="/clubs" />
      <PageMain>
        <CreateClubForm />
      </PageMain>
    </>
  );
}
