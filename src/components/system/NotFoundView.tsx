import { House, Search } from "lucide-react";
import { getTranslations } from "next-intl/server";
import type { ReactNode } from "react";
import { PageHeader } from "@/components/shell/PageHeader";
import { PageMain } from "@/components/shell/PageMain";
import { EmptyState } from "@/components/ui/EmptyState";

/** Destinations proposées depuis une page introuvable. */
type Exit = "home" | "search";

/**
 * Page introuvable (IA, pages système), commune à la 404 générale et aux 404 d'une chanson, d'une
 * playlist et d'un club : l'en-tête, puis un état vide dont le titre est le h1 de la page, une phrase
 * qui dit pourquoi sans rien révéler (club privé, playlist d'un autre), et une ou deux sorties.
 * Next.js répond en 404 et ajoute `noindex`.
 */
export async function NotFoundView({
  title,
  body,
  primary,
  secondary,
  header,
}: {
  title: string;
  body: string;
  primary: Exit;
  secondary?: Exit;
  /** En-tête de la page ; par défaut celui d'une page de premier niveau (logo). */
  header?: ReactNode;
}) {
  const t = await getTranslations("system.notFound");
  const exits: Record<Exit, { label: string; href: string; icon: ReactNode }> = {
    home: { label: t("home"), href: "/", icon: <House aria-hidden="true" className="size-4" /> },
    search: { label: t("search"), href: "/recherche", icon: <Search aria-hidden="true" className="size-4" /> },
  };

  return (
    <>
      {header ?? <PageHeader variant="root" />}
      <PageMain>
        <EmptyState
          titleAs="h1"
          title={title}
          body={body}
          action={exits[primary]}
          secondary={secondary ? exits[secondary] : undefined}
        />
      </PageMain>
    </>
  );
}
