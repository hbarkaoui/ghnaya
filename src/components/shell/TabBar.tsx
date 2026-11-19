"use client";

import { House, Search, UserRound, Users, type LucideIcon } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";

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
 * Exportée pour les toasts, qui se posent au-dessus de la barre quand elle est affichée.
 */
export const isTabBarHidden = (path: string) => path.includes("/lecture") || path.startsWith("/connexion");

/** Rôle de l'utilisateur, qui nomme le 3e onglet. */
export type TabBarRole = "animator" | "member" | "visitor";

/**
 * Barre de 4 onglets en bas de l'écran.
 * L'onglet actif est marqué par le losange safran et un libellé en graisse 500 ;
 * l'ordre suit le sens de l'interface (en arabe, Accueil est à droite).
 * Le 3e onglet s'appelle « Clubs » pour un animateur (il en a plusieurs) et « Mon club » pour un membre
 * (il n'en a qu'un) ; un visiteur voit « Clubs ».
 */
export function TabBar({ role }: { role: TabBarRole }) {
  const pathname = usePathname();
  const t = useTranslations("nav");
  if (isTabBarHidden(pathname)) return null;

  return (
    <nav
      aria-label={t("label")}
      className="fixed inset-x-0 bottom-0 z-(--z-tabbar) border-t border-line-subtle bg-card pb-[env(safe-area-inset-bottom)]"
    >
      <ul className="mx-auto grid max-w-content grid-cols-4">
        {TABS.map(({ href, key, Icon, matches }) => {
          const active = matches(pathname);
          return (
            <li key={key}>
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className="flex h-(--size-tabbar) flex-col items-center justify-center gap-1 text-xs"
              >
                <span
                  aria-hidden="true"
                  className={`block size-1.5 rotate-45 ${active ? "bg-ornament" : "bg-transparent"}`}
                />
                <Icon aria-hidden="true" className={`size-6 ${active ? "text-ink" : "text-ink-2"}`} strokeWidth={active ? 2 : 1.75} />
                <span className={active ? "font-medium text-ink" : "text-ink-2"}>
                  {t(key === "clubs" && role === "member" ? "myClub" : key)}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
