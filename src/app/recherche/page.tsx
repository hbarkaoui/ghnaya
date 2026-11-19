import { Clock, Info, Plus } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { Suspense } from "react";
import { AddToPlaylistButton } from "@/components/playlist/AddToPlaylist";
import { AddToPlaylistScope } from "@/components/playlist/AddToPlaylistScope";
import { DialectFilter } from "@/components/search/DialectFilter";
import { ResultsSkeleton } from "@/components/search/ResultsSkeleton";
import { SearchBar } from "@/components/search/SearchBar";
import { SongResultItem } from "@/components/search/SongResultItem";
import { PageHeader } from "@/components/shell/PageHeader";
import { PageMain } from "@/components/shell/PageMain";
import { EmptyState } from "@/components/ui/EmptyState";
import { Pagination } from "@/components/ui/Pagination";
import { parseSearchParams, searchHref, type SearchParams } from "@/lib/search/searchParams";
import { searchSongs } from "@/lib/search/searchSongs";
import { PAGE_SIZE } from "@/lib/search/types";
import { PREVIEW_PAGE_SIZE, searchPreviewFrom, searchWithSmallPages, type SearchPreview } from "@/mocks/searchPreview";

/** Requêtes d'exemple, quand la barre est vide : la recherche accepte l'arabe comme l'arabizi. */
const EXAMPLES = ["sidi mansour", "3la nar", "سيدي منصور"];

/** Isole un texte de l'utilisateur dans une phrase de l'autre sens d'écriture (FSI … PDI). */
const isolate = (text: string) => `⁨${text}⁩`;

export async function generateMetadata({ searchParams }: PageProps<"/recherche">): Promise<Metadata> {
  const t = await getTranslations("search");
  const { q } = parseSearchParams(await searchParams);
  return { title: q.trim() ? t("metaTitle", { query: q.trim() }) : t("title") };
}

/** Chercher (IA) : la barre avec la requête conservée, le nombre de résultats et le filtre, les résultats, la pagination. */
export default async function SearchPage({ searchParams }: PageProps<"/recherche">) {
  const raw = await searchParams;
  const params = parseSearchParams(raw);
  const preview = searchPreviewFrom(raw.apercu);
  const t = await getTranslations("search");
  const hasQuery = params.q.trim() !== "";

  return (
    <>
      <PageHeader variant="root" />
      <PageMain>
        <h1 className={hasQuery ? "sr-only" : "mb-4 text-2xl font-medium"}>{t("title")}</h1>
        <SearchBar defaultValue={params.q} autoFocus={!hasQuery} />
        {preview ? (
          <p lang="fr" dir="ltr" className="mt-2 text-xs text-ink-3">
            Aperçu de développement : {preview === "limite" ? "limite de requêtes simulée" : `pages de ${PREVIEW_PAGE_SIZE} résultats`}.
          </p>
        ) : null}
        {hasQuery ? (
          // La clé remonte la zone à chaque recherche : le squelette s'affiche aussi d'une requête à l'autre.
          <Suspense
            key={searchHref({ ...params, preview })}
            fallback={<ResultsSkeleton label={t("loading")} />}
          >
            <SearchResults params={params} preview={preview} />
          </Suspense>
        ) : (
          <SearchIntro />
        )}
      </PageMain>
    </>
  );
}

async function SearchIntro() {
  const t = await getTranslations("search");
  return (
    <section className="mt-5">
      <p className="text-ink-2">{t("intro")}</p>
      <p className="mt-4 text-sm text-ink-2" id="search-examples">
        {t("examples")}
      </p>
      <ul aria-labelledby="search-examples" className="mt-2 flex flex-wrap gap-2">
        {EXAMPLES.map((example) => {
          const arabic = /\p{Script=Arabic}/u.test(example);
          return (
            <li key={example}>
              <Link
                href={searchHref({ q: example })}
                lang={arabic ? "ar" : undefined}
                dir={arabic ? "rtl" : "ltr"}
                className="inline-flex min-h-11 items-center rounded-full border border-line bg-card px-4 text-ink hover:bg-well"
              >
                {example}
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

async function SearchResults({ params, preview }: { params: SearchParams; preview: SearchPreview | null }) {
  const t = await getTranslations();
  const { q, page, dialect } = params;

  // MAQUETTE : limite de requêtes simulée en développement (?apercu=limite). Le plan 1 (tâche 9)
  // branchera ici hitRateLimit(`search:${clientIp}`, 60, 60).
  if (preview === "limite") return <RateLimited />;

  const smallPages = preview === "pagination";
  const result = smallPages ? await searchWithSmallPages(q, { dialect, page }) : await searchSongs(q, { dialect, page });
  const pageSize = smallPages ? PREVIEW_PAGE_SIZE : PAGE_SIZE;

  if (result.tooShort) {
    return (
      <p className="mt-4 flex items-start gap-2 text-ink-2">
        <Info aria-hidden="true" className="mt-0.5 size-5 shrink-0" />
        {t("search.tooShort")}
      </p>
    );
  }

  const proposeHref = `/contribuer?${new URLSearchParams({ titre: q.trim() }).toString()}`;
  const proposeAction = { label: t("search.propose"), href: proposeHref, icon: <Plus aria-hidden="true" className="size-4" /> };
  const filter = (
    <DialectFilter current={dialect} hrefFor={(d) => searchHref({ q, dialect: d, preview })} />
  );

  if (result.items.length === 0) {
    // Au-delà de la dernière page, la recherche renvoie un total à 0 : on propose de revenir au début.
    if (page > 1) {
      return (
        <div className="mt-6">
          <EmptyState
            title={t("search.emptyPageTitle")}
            body={t("search.emptyPageBody")}
            action={{ label: t("search.firstPage"), href: searchHref({ q, dialect, preview }) }}
          />
        </div>
      );
    }
    if (dialect) {
      return (
        <>
          <div className="mt-5 flex justify-end">{filter}</div>
          <div className="mt-3">
            <EmptyState
              title={t("search.noResultsDialectTitle")}
              body={t("search.noResultsDialectBody", { query: isolate(q.trim()), dialect: t(`dialects.${dialect}`) })}
              action={{ label: t("search.allDialects"), href: searchHref({ q, preview }) }}
              secondary={proposeAction}
            />
          </div>
        </>
      );
    }
    return (
      <div className="mt-6">
        <EmptyState
          title={t("search.noResultsTitle")}
          body={t("search.noResultsBody", { query: isolate(q.trim()) })}
          action={proposeAction}
        />
      </div>
    );
  }

  const lastPage = Math.max(1, Math.ceil(result.total / pageSize));

  return (
    <section aria-labelledby="search-count" className="mt-5">
      <div className="flex items-center justify-between gap-3">
        <h2 id="search-count" className="text-sm text-ink-2">
          {t("search.results", { count: result.total, n: String(result.total) })}
        </h2>
        {filter}
      </div>
      {/* Une seule feuille « Ajouter à une playlist » pour la page ; après un ajout, la recherche reste affichée. */}
      <AddToPlaylistScope returnTo={searchHref({ q, dialect, page, preview })}>
        <ul className="mt-3 flex flex-col gap-3">
          {result.items.map((hit) => (
            <SongResultItem
              key={hit.id}
              hit={hit}
              query={q}
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
      <Pagination page={page} lastPage={lastPage} hrefFor={(p) => searchHref({ q, dialect, page: p, preview })} />
    </section>
  );
}

async function RateLimited() {
  const t = await getTranslations("search");
  return (
    <div role="alert" className="mt-6 flex items-start gap-3 rounded-lg bg-warning-soft p-4">
      <Clock aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-warning" />
      <div>
        <p className="font-medium text-warning">{t("rateLimitedTitle")}</p>
        <p className="mt-1 text-ink">{t("rateLimitedBody")}</p>
      </div>
    </div>
  );
}
