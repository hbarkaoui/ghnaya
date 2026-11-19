import { Search } from "lucide-react";
import Form from "next/form";
import { getTranslations } from "next-intl/server";

/**
 * Barre de recherche : formulaire GET vers /recherche. Avec JavaScript, next/form fait une navigation
 * côté client (la barre d'onglets reste en place, l'état de chargement est préchargé) ; sans
 * JavaScript, c'est un formulaire HTML ordinaire.
 * L'écriture (arabe ou latine) est détectée par le navigateur (dir="auto").
 */
export async function SearchBar({ defaultValue = "", autoFocus = false }: { defaultValue?: string; autoFocus?: boolean }) {
  const t = await getTranslations("search");

  return (
    // Le champ et le bouton sont côte à côte (flex), et non le bouton posé sur le champ : avec dir="auto",
    // une requête arabe dans l'interface française passe le champ de droite à gauche, et une marge
    // logique réservée au bouton changerait alors de côté (le texte passait sous la loupe).
    <Form
      action="/recherche"
      role="search"
      className="flex h-14 items-stretch gap-1 rounded-lg border border-line bg-card p-1 has-[input:focus-visible]:border-focus has-[input:focus-visible]:outline-3 has-[input:focus-visible]:outline-offset-2 has-[input:focus-visible]:outline-focus"
    >
      <label htmlFor="search-q" className="sr-only">
        {t("label")}
      </label>
      <input
        // Remonté à chaque requête : après un retour arrière, le champ affiche la requête de la page.
        key={defaultValue}
        id="search-q"
        type="search"
        name="q"
        defaultValue={defaultValue}
        placeholder={t("placeholder")}
        dir="auto"
        autoComplete="off"
        enterKeyHint="search"
        autoFocus={autoFocus}
        className="min-w-0 flex-1 rounded-md bg-transparent px-3 text-lg text-ink placeholder:text-ink-3 focus-visible:outline-none"
      />
      <button
        type="submit"
        aria-label={t("submit")}
        className="inline-flex w-12 shrink-0 items-center justify-center rounded-md bg-accent text-accent-ink hover:bg-accent-hover"
      >
        <Search aria-hidden="true" className="size-5" />
      </button>
    </Form>
  );
}
