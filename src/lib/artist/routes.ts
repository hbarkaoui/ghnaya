type RawParams = Record<string, string | string[] | undefined>;

/** Chansons par page sur la page artiste (IA, « Croissance du contenu »). */
export const ARTIST_PAGE_SIZE = 50;

const first = (value: string | string[] | undefined): string | undefined =>
  Array.isArray(value) ? value[0] : value;

/** Paramètres de /artiste/[id] (IA, stratégie d'URL) : `page`, à partir de 1. */
export function parseArtistParams(params: RawParams): { page: number } {
  const page = Number(first(params.page));
  return { page: Number.isInteger(page) && page > 0 ? page : 1 };
}

/** Adresse d'une page artiste. La page 1 est implicite. */
export function artistHref(id: string, page = 1): string {
  const path = `/artiste/${encodeURIComponent(id)}`;
  return page > 1 ? `${path}?page=${page}` : path;
}
