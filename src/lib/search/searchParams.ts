import { isDialect, type Dialect } from "@/types/catalog";

type RawParams = Record<string, string | string[] | undefined>;

export interface SearchParams {
  q: string;
  page: number;
  dialect?: Dialect;
}

const first = (value: string | string[] | undefined): string | undefined =>
  Array.isArray(value) ? value[0] : value;

/** Paramètres de /recherche (IA, stratégie d'URL) : `q`, `page` à partir de 1, `dialecte`. */
export function parseSearchParams(params: RawParams): SearchParams {
  const page = Number(first(params.page));
  const dialect = first(params.dialecte);
  return {
    q: first(params.q) ?? "",
    page: Number.isInteger(page) && page > 0 ? page : 1,
    ...(isDialect(dialect) ? { dialect } : {}),
  };
}

/** Adresse d'une page de résultats. La page 1 est implicite ; `preview` garde l'aperçu de développement. */
export function searchHref({ q, dialect, page = 1, preview }: Partial<SearchParams> & { preview?: string | null }): string {
  const params = new URLSearchParams();
  params.set("q", q ?? "");
  if (dialect) params.set("dialecte", dialect);
  if (page > 1) params.set("page", String(page));
  if (preview) params.set("apercu", preview);
  return `/recherche?${params.toString()}`;
}
