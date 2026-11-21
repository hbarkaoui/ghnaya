import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import { AddToPlaylistButton } from "@/components/playlist/AddToPlaylist";
import { AddToPlaylistScope } from "@/components/playlist/AddToPlaylistScope";
import { SongResultItem } from "@/components/search/SongResultItem";
import { PageHeader } from "@/components/shell/PageHeader";
import { PageMain } from "@/components/shell/PageMain";
import { artistDisplayName } from "@/components/song/artistName";
import { EmptyState } from "@/components/ui/EmptyState";
import { Pagination } from "@/components/ui/Pagination";
import { artistHref, parseArtistParams } from "@/lib/artist/routes";
import { getArtistPage } from "@/lib/catalog/read";

export async function generateMetadata({ params, searchParams }: PageProps<"/artiste/[id]">): Promise<Metadata> {
  const [{ id }, raw] = await Promise.all([params, searchParams]);
  const data = await getArtistPage(id, parseArtistParams(raw).page);
  const [locale, t] = await Promise.all([getLocale(), getTranslations("artist")]);
  if (!data) return { title: t("metaNotFound") };
  return {
    title: artistDisplayName(data.artist, locale).name,
    description: t("songCount", { count: data.total, n: String(data.total) }),
  };
}

/**
 * Page artiste (IA, sous Chercher) : les noms arabe et latin, le nombre de chansons, puis ses chansons
 * en résultats de recherche avec « Ajouter », 50 par page. Un artiste inconnu renvoie la 404 du segment.
 */
export default async function ArtistPage({ params, searchParams }: PageProps<"/artiste/[id]">) {
  const [{ id }, raw] = await Promise.all([params, searchParams]);
  const { page } = parseArtistParams(raw);
  const data = await getArtistPage(id, page);
  if (!data) notFound();

  const t = await getTranslations("artist");
  const { artist, total, lastPage, items } = data;

  return (
    <>
      <PageHeader variant="sub" backHref="/recherche" backToHistory />
      <PageMain>
        <header>
          <h1>
            {artist.nameAr ? (
              <span className="block font-display text-2xl leading-snug font-semibold">
                <span lang="ar" dir="rtl">
                  {artist.nameAr}
                </span>
              </span>
            ) : null}
            {artist.nameLatin ? (
              <span
                className={
                  artist.nameAr ? "mt-1 block text-lg text-ink-2" : "block font-display text-2xl leading-snug font-semibold"
                }
              >
                <span dir="ltr">{artist.nameLatin}</span>
              </span>
            ) : null}
          </h1>
          <p className="mt-2 text-sm text-ink-2">{t("songCount", { count: total, n: String(total) })}</p>
        </header>

        <section aria-labelledby="artist-songs" className="mt-6">
          <h2 id="artist-songs" className="text-lg font-medium">
            {t("songsTitle")}
          </h2>
          {items.length === 0 ? (
            // Au-delà de la dernière page : on propose de revenir au début, comme la recherche.
            <div className="mt-3">
              <EmptyState
                title={t("emptyPageTitle")}
                body={t("emptyPageBody")}
                action={{ label: t("firstPage"), href: artistHref(artist.id) }}
              />
            </div>
          ) : (
            <>
              {/* Une seule feuille « Ajouter à une playlist » pour la page ; après un ajout, la page reste affichée. */}
              <AddToPlaylistScope returnTo={artistHref(artist.id, page)}>
                <ul className="mt-3 flex flex-col gap-3">
                  {items.map((hit) => (
                    <SongResultItem
                      key={hit.id}
                      hit={hit}
                      omitArtistId={artist.id}
                      actions={
                        <AddToPlaylistButton
                          variant="compact"
                          song={{ id: hit.id, titleAr: hit.titleAr, titleLatin: hit.titleLatin }}
                        />
                      }
                    />
                  ))}
                </ul>
              </AddToPlaylistScope>
              <Pagination page={page} lastPage={lastPage} hrefFor={(p) => artistHref(artist.id, p)} />
            </>
          )}
        </section>
      </PageMain>
    </>
  );
}
