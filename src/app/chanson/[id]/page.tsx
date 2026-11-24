import { Flag, Maximize, PencilLine } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import { AddToPlaylistButton } from "@/components/playlist/AddToPlaylist";
import { AddToPlaylistScope } from "@/components/playlist/AddToPlaylistScope";
import { PageHeader } from "@/components/shell/PageHeader";
import { PageMain } from "@/components/shell/PageMain";
import { ArtistNames } from "@/components/song/ArtistNames";
import { artistsLine } from "@/components/song/artistName";
import { SongLyrics } from "@/components/song/SongLyrics";
import { songDisplayTitle } from "@/components/song/songTitle";
import { Badge } from "@/components/ui/Badge";
import { getSong } from "@/lib/catalog/read";

// Plan 5, tâche 3 : l'action de translittération appelée depuis cette page peut durer 30 s (génération) ou
// 35 s (attente d'une génération en cours). Valable pour toutes les actions serveur de la page.
export const maxDuration = 60;

export async function generateMetadata({ params }: PageProps<"/chanson/[id]">): Promise<Metadata> {
  const { id } = await params;
  const song = await getSong(id);
  const [locale, t] = await Promise.all([getLocale(), getTranslations("song")]);
  if (!song) return { title: t("notFoundMeta") };
  return { title: songDisplayTitle(song, locale), description: artistsLine(song.artists, locale) };
}

const SECONDARY_ACTION =
  "inline-flex min-h-11 items-center gap-2 rounded-md px-3 text-ink-2 transition-colors duration-(--duration-fast) hover:bg-well hover:text-ink";

/**
 * Fiche chanson (IA, « Chanson ») : titres arabe et latin, artistes avec liens et dialecte ; Mode séance ;
 * paroles avec la bascule de mode ; source ; puis Proposer une correction et Signaler.
 * Une chanson inconnue ou retirée renvoie la 404 du segment (not-found.tsx).
 */
export default async function SongPage({ params }: PageProps<"/chanson/[id]">) {
  const { id } = await params;
  const song = await getSong(id);
  if (!song) notFound();

  const t = await getTranslations();
  const { titleAr, titleLatin, lyrics, lyricsTranslit, translitStatus } = song;

  return (
    <>
      <PageHeader variant="sub" backHref="/recherche" backToHistory />
      <PageMain>
        <header>
          <h1>
            {titleAr ? (
              <span className="block font-display text-2xl leading-snug font-semibold">
                <span lang="ar" dir="rtl">
                  {titleAr}
                </span>
              </span>
            ) : null}
            {titleLatin ? (
              <span
                className={titleAr ? "mt-1 block text-lg text-ink-2" : "block font-display text-2xl leading-snug font-semibold"}
              >
                <span dir="ltr">{titleLatin}</span>
              </span>
            ) : null}
          </h1>
          <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1">
            <ArtistNames artists={song.artists} linked />
            <Badge>
              <span className="sr-only">{t("song.dialectLabel")} </span>
              {t(`dialects.${song.dialect}`)}
            </Badge>
          </div>
        </header>

        <div className="mt-5 flex flex-wrap gap-3">
          <Link
            href={`/chanson/${song.id}/lecture`}
            className="inline-flex min-h-12 flex-1 items-center justify-center gap-2 rounded-md bg-accent px-5 font-medium text-accent-ink transition-colors duration-(--duration-fast) hover:bg-accent-hover"
          >
            <Maximize aria-hidden="true" className="size-5" />
            {t("song.sessionMode")}
          </Link>
          <AddToPlaylistScope returnTo={`/chanson/${song.id}`}>
            <AddToPlaylistButton variant="full" song={{ id: song.id, titleAr, titleLatin }} />
          </AddToPlaylistScope>
        </div>

        <section aria-labelledby="lyrics-title" className="mt-8">
          <h2 id="lyrics-title" className="mb-3 text-lg font-medium">
            {t("lyrics.title")}
          </h2>
          <SongLyrics song={{ id: song.id, lyrics, lyricsTranslit, translitStatus }} />
          <p className="mt-8 text-sm text-ink-2">
            {t("song.sourceLabel")} <span dir="auto">{t(`song.sources.${song.source}`)}</span>
          </p>
        </section>

        <div className="mt-4 border-t border-line-subtle pt-3">
          {/* Le retrait négatif aligne le texte des actions sur la colonne, leur fond au survol déborde. */}
          <div className="-mx-3 flex flex-wrap gap-x-2">
            <Link href={`/contribuer/${song.id}`} className={SECONDARY_ACTION}>
              <PencilLine aria-hidden="true" className="size-5" />
              {t("song.suggestCorrection")}
            </Link>
            <Link href={`/signaler/${song.id}`} className={SECONDARY_ACTION}>
              <Flag aria-hidden="true" className="size-5" />
              {t("song.report")}
            </Link>
          </div>
        </div>
      </PageMain>
    </>
  );
}
