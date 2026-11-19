"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export type SubTab = { href: string; label: string };

const decode = (path: string) => {
  try {
    return decodeURIComponent(path);
  } catch {
    return path;
  }
};

/**
 * Sous-onglets en haut de page (IA, navigation secondaire) : Club (Playlists · Membres · Réglages),
 * Modération (Propositions · Signalements). Ce sont des liens : chaque sous-onglet a sa propre adresse.
 * Le sous-onglet actif est souligné en safran, avec le losange des onglets principaux.
 */
export function SubTabs({ label, items }: { label: string; items: SubTab[] }) {
  const current = decode(usePathname());

  return (
    <nav aria-label={label} className="border-b border-line-subtle">
      {/* Pas de défilement horizontal : il ferait déborder le losange (barre de défilement parasite), et 3 sous-onglets tiennent en 375 px. */}
      <ul className="-mb-px flex flex-wrap gap-1">
        {items.map((item) => {
          const active = decode(item.href) === current;
          return (
            <li key={item.href} className="shrink-0">
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={`relative inline-flex min-h-11 items-center px-3 transition-colors duration-(--duration-fast) ${
                  active ? "font-medium text-ink" : "text-ink-2 hover:text-ink"
                }`}
              >
                {item.label}
                {active ? (
                  <>
                    <span aria-hidden="true" className="absolute inset-x-3 bottom-0 h-0.5 rounded-full bg-ornament" />
                    <span aria-hidden="true" className="absolute bottom-[-2.5px] left-1/2 size-1.5 -translate-x-1/2 rotate-45 bg-ornament" />
                  </>
                ) : null}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
