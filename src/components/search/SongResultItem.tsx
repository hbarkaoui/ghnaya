import Link from "next/link";
import { getTranslations } from "next-intl/server";
import type { ReactNode } from "react";
import { ArtistNames } from "@/components/song/ArtistNames";
import { highlightSnippet } from "@/lib/search/highlight";
import { prepareQuery } from "@/lib/search/query";
import type { SongHit } from "@/lib/search/types";

/**
 * Un résultat de recherche : titre arabe, titre latin, artistes et, si la correspondance vient des
 * paroles, la ligne trouvée avec le passage surligné. Toute la carte mène à la fiche chanson.
 *
 * `actions` : emplacement des actions de la ligne, en bout de carte et au-dessus du lien (« Ajouter à
 * une playlist » dans Chercher, ↑ ↓ ✕ dans une playlist en édition). Rien n'y est passé tant que la
 * feuille « Ajouter à une playlist » (tâche 9) n'existe pas.
 */
export async function SongResultItem({
  hit,
  query,
  actions,
}: {
  hit: SongHit;
  /** Requête d'origine, pour surligner le passage trouvé dans l'extrait. */
  query?: string;
  actions?: ReactNode;
}) {
  const t = await getTranslations("search");
  const segments = hit.snippet ? highlightSnippet(hit.snippet, prepareQuery(query ?? "")) : null;

  return (
    <li className="relative flex items-start gap-3 rounded-lg border border-line-subtle bg-card p-4 transition-colors duration-(--duration-fast) hover:bg-well">
      <div className="min-w-0 flex-1">
        <Link href={`/chanson/${hit.id}`} className="block after:absolute after:inset-0 after:rounded-lg">
          {hit.titleAr ? (
            <span className="block text-md font-medium">
              <span lang="ar" dir="rtl">
                {hit.titleAr}
              </span>
            </span>
          ) : null}
          {hit.titleLatin ? (
            <span className={`block ${hit.titleAr ? "text-ink-2" : "text-md font-medium"}`}>
              <span dir="ltr">{hit.titleLatin}</span>
            </span>
          ) : null}
        </Link>
        <ArtistNames artists={hit.artists} className="mt-0.5 block text-sm text-ink-2" />
        {segments ? (
          <p className="mt-3 border-s-2 border-ornament ps-3 text-ink-2">
            <span className="sr-only">{t("snippetLabel")} </span>
            <span lang="ar" dir="rtl" className="font-lyrics text-base leading-relaxed">
              {segments.map((segment, i) =>
                segment.hit ? (
                  <mark key={i} className="rounded-sm bg-selected px-0.5 font-medium text-ink">
                    {segment.text}
                  </mark>
                ) : (
                  segment.text
                ),
              )}
            </span>
          </p>
        ) : null}
      </div>
      {actions ? <div className="relative z-10 shrink-0">{actions}</div> : null}
    </li>
  );
}
