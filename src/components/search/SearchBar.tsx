import { Search } from "lucide-react";
import { getTranslations } from "next-intl/server";

/**
 * Barre de recherche : formulaire GET vers /recherche (fonctionne sans JavaScript).
 * L'écriture (arabe ou latine) est détectée par le navigateur (dir="auto").
 */
export async function SearchBar({ defaultValue = "", autoFocus = false }: { defaultValue?: string; autoFocus?: boolean }) {
  const t = await getTranslations("search");

  return (
    <form action="/recherche" method="get" role="search" className="relative">
      <label htmlFor="search-q" className="sr-only">
        {t("label")}
      </label>
      <input
        id="search-q"
        type="search"
        name="q"
        defaultValue={defaultValue}
        placeholder={t("placeholder")}
        dir="auto"
        autoComplete="off"
        enterKeyHint="search"
        autoFocus={autoFocus}
        className="h-14 w-full rounded-lg border border-line bg-card ps-4 pe-14 text-lg text-ink placeholder:text-ink-3 focus-visible:border-focus"
      />
      <button
        type="submit"
        aria-label={t("submit")}
        className="absolute inset-y-1 end-1 inline-flex w-12 items-center justify-center rounded-md bg-accent text-accent-ink hover:bg-accent-hover"
      >
        <Search aria-hidden="true" className="size-5" />
      </button>
    </form>
  );
}
