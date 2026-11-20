"use client";

import { House, Search, UserRound, Users, type LucideIcon } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import type { ReactNode } from "react";
import { LogoLockup } from "@/components/brand/Logo";

type Tab = {
  href: string;
  key: "home" | "search" | "clubs" | "me";
  Icon: LucideIcon;
  matches: (path: string) => boolean;
};

const TABS: Tab[] = [
  { href: "/", key: "home", Icon: House, matches: (p) => p === "/" },
  {
    href: "/recherche",
    key: "search",
    Icon: Search,
    matches: (p) => ["/recherche", "/chanson", "/artiste", "/signaler"].some((s) => p.startsWith(s)),
  },
  {
    href: "/clubs",
    key: "clubs",
    Icon: Users,
    matches: (p) => p.startsWith("/clubs") || p.startsWith("/rejoindre"),
  },
  {
    href: "/moi",
    key: "me",
    Icon: UserRound,
    matches: (p) =>
      ["/moi", "/playlists", "/mes-contributions", "/contribuer", "/moderation", "/a-propos"].some((s) =>
        p.startsWith(s),
      ),
  },
];

/**
 * Barre masquée dans le lecteur de séance et pendant la connexion (IA, modèle de navigation).
 * Exportée pour les toasts, qui se posent au-dessus de la barre du bas quand elle est affichée.
 */
export const isTabBarHidden = (path: string) => path.includes("/lecture") || path.startsWith("/connexion");

/** Rôle de l'utilisateur, qui nomme le 3e onglet. */
export type TabBarRole = "animator" | "member" | "visitor";

/**
 * Barre de 4 onglets (IA, modèle de navigation).
 *  - En dessous de 768 px : fixée en bas de l'écran, au-dessus de la zone de sécurité.
 *  - À partir de 768 px : une barre en haut de l'écran, collante, dans la colonne de 640 px : le logo
 *    (lien vers l'accueil), puis les onglets, et sur l'Accueil la bascule de langue FR · ع au bout de la
 *    ligne. L'en-tête des pages de premier niveau (`RootHeaderBar`), qui porte le logo et la bascule en
 *    mobile, est alors masqué ; celui des pages de second niveau (retour, titre) se place dessous.
 * Une seule navigation dans la page, placée avant le contenu : l'ordre de lecture et de tabulation suit
 * la barre du haut, et la même navigation descend en bas de l'écran sur mobile.
 * L'onglet actif est marqué par le losange safran et un libellé en graisse 500 ; l'ordre suit le sens de
 * l'interface (en arabe, Accueil et le logo sont à droite).
 * Le 3e onglet s'appelle « Clubs » pour un animateur (il en a plusieurs) et « Mon club » pour un membre
 * (il n'en a qu'un) ; un visiteur voit « Clubs ».
 */
export function TabBar({
  role,
  localeSwitcher,
}: {
  role: TabBarRole;
  /** Bascule de langue FR · ع, montrée dans la barre du haut sur l'Accueil (à partir de 768 px). */
  localeSwitcher?: ReactNode;
}) {
  const pathname = usePathname();
  const t = useTranslations();
  if (isTabBarHidden(pathname)) return null;

  return (
    // En mobile, ce bloc n'a pas de hauteur : la navigation est fixée en bas et le reste est masqué.
    <div className="md:sticky md:top-0 md:z-(--z-tabbar) md:border-b md:border-line-subtle md:bg-page md:pt-[env(safe-area-inset-top)]">
      {/* Lien d'évitement (WCAG 2.4.1) : la navigation précède le contenu dans le DOM ; au clavier, le premier
          Tab le fait apparaître et Entrée saute au <main id="contenu"> de PageMain. Il n'existe qu'avec la barre. */}
      <a
        href="#contenu"
        className="sr-only z-(--z-toast) rounded-md bg-card px-4 font-medium text-link shadow-md focus:not-sr-only focus:fixed focus:start-4 focus:top-[calc(env(safe-area-inset-top)+0.5rem)] focus:inline-flex focus:min-h-11 focus:items-center"
      >
        {t("a11y.skipToContent")}
      </a>
      <div className="md:mx-auto md:flex md:max-w-content md:items-center md:gap-4 md:px-4">
        <nav
          aria-label={t("nav.label")}
          className="fixed inset-x-0 bottom-0 z-(--z-tabbar) border-t border-line-subtle bg-card pb-[env(safe-area-inset-bottom)] md:static md:z-auto md:flex md:min-w-0 md:flex-1 md:items-center md:gap-6 md:border-t-0 md:bg-transparent md:pb-0"
        >
          <Link href="/" aria-label={t("app.name")} className="hidden min-h-11 shrink-0 items-center rounded-md md:inline-flex">
            <LogoLockup />
          </Link>
          <ul className="mx-auto grid max-w-content grid-cols-4 md:mx-0 md:flex md:gap-1">
            {TABS.map(({ href, key, Icon, matches }) => {
              const active = matches(pathname);
              return (
                <li key={key}>
                  <Link
                    href={href}
                    aria-current={active ? "page" : undefined}
                    className="group flex h-(--size-tabbar) flex-col items-center justify-center gap-1 text-xs md:min-w-18 md:px-3"
                  >
                    <span
                      aria-hidden="true"
                      className={`block size-1.5 rotate-45 ${active ? "bg-ornament" : "bg-transparent"}`}
                    />
                    {/* Icône en 24 px fixes (attributs de lucide), libellé en rem : quand le système agrandit le
                        texte, la barre (--size-tabbar, en rem) grandit pour le libellé, sur deux lignes au besoin. */}
                    <Icon
                      aria-hidden="true"
                      className={`shrink-0 ${active ? "text-ink" : "text-ink-2 group-hover:text-ink"}`}
                      strokeWidth={active ? 2 : 1.75}
                    />
                    <span
                      className={`text-center leading-tight ${active ? "font-medium text-ink" : "text-ink-2 group-hover:text-ink"}`}
                    >
                      {t(key === "clubs" && role === "member" ? "nav.myClub" : `nav.${key}`)}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
        {localeSwitcher && pathname === "/" ? <div className="hidden shrink-0 md:block">{localeSwitcher}</div> : null}
      </div>
    </div>
  );
}
