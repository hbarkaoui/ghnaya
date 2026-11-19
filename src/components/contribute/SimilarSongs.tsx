import { Info } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { SongResultItem } from "@/components/search/SongResultItem";
import { SONGS } from "@/mocks/catalog";
import { findSimilarSongs } from "@/mocks/similar";

/**
 * Encadré « existe peut-être déjà » (spec §8.2) : jusqu'à 3 chansons proches du titre et des artistes
 * saisis, sans extrait. On peut ouvrir l'une d'elles, ou continuer sa proposition. Rien s'il n'y en a pas.
 */
export async function SimilarSongs({ titles, artists }: { titles: string[]; artists: string[] }) {
  const hits = findSimilarSongs(SONGS, { titles, artists });
  if (hits.length === 0) return null;
  const t = await getTranslations("contribute.similar");

  return (
    <section aria-labelledby="chansons-proches" className="rounded-lg bg-info-soft p-4">
      <h2 id="chansons-proches" className="flex items-start gap-2 font-medium text-ink">
        <Info aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-info" />
        {t("title")}
      </h2>
      <p className="mt-1 ps-7 text-sm text-ink-2">{t("body")}</p>
      <ul className="mt-3 flex flex-col gap-2">
        {hits.map((hit) => (
          <SongResultItem key={hit.id} hit={hit} />
        ))}
      </ul>
    </section>
  );
}
