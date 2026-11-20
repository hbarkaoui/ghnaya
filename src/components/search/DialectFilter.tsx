import { Check, ChevronDown, X } from "lucide-react";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { DIALECTS, type Dialect } from "@/types/catalog";

/**
 * Filtre de dialecte en pastille (?dialecte=). Sans JavaScript : un <details> qui déroule des liens.
 * Quand un dialecte est choisi, la pastille porte son nom et un bouton ✕ retire le filtre.
 */
export async function DialectFilter({
  current,
  hrefFor,
}: {
  current?: Dialect;
  hrefFor: (dialect?: Dialect) => string;
}) {
  const t = await getTranslations();
  const options: Array<Dialect | undefined> = [undefined, ...DIALECTS];

  return (
    // ms-auto : renvoyé à la ligne (texte agrandi), le filtre reste au bout de la ligne et sa liste, ancrée
    // sur ce bout (end-0), ne sort pas de l'écran.
    <div className="ms-auto flex items-center gap-1">
      <details className="group relative">
        <summary
          className={`inline-flex min-h-11 cursor-pointer list-none items-center gap-1.5 rounded-full border px-4 text-sm font-medium select-none hover:bg-well [&::-webkit-details-marker]:hidden ${
            current ? "border-focus bg-selected text-ink" : "border-line text-ink"
          }`}
        >
          {/* Le nom accessible reprend le texte visible (WCAG 2.5.3), précédé de ce qu'il filtre. */}
          {current ? (
            <>
              <span className="sr-only">{t("search.dialect.current")} </span>
              {t(`dialects.${current}`)}
            </>
          ) : (
            t("search.dialect.button")
          )}
          <ChevronDown aria-hidden="true" className="size-4 transition-transform duration-(--duration-fast) group-open:rotate-180" />
        </summary>
        <ul className="absolute end-0 z-20 mt-2 w-60 max-w-[calc(100vw-2rem)] rounded-lg border border-line-subtle bg-card p-1 shadow-(--shadow-lg)">
          {options.map((dialect) => {
            const selected = dialect === current;
            return (
              <li key={dialect ?? "all"}>
                <Link
                  href={hrefFor(dialect)}
                  aria-current={selected ? "true" : undefined}
                  className="flex min-h-11 items-center justify-between gap-3 rounded-md px-3 text-ink hover:bg-well aria-[current]:font-medium"
                >
                  {dialect ? t(`dialects.${dialect}`) : t("search.dialect.all")}
                  {selected ? <Check aria-hidden="true" className="size-4 text-link" /> : null}
                </Link>
              </li>
            );
          })}
        </ul>
      </details>
      {current ? (
        <Link
          href={hrefFor(undefined)}
          aria-label={t("search.dialect.clear", { dialect: t(`dialects.${current}`) })}
          className="inline-flex size-11 items-center justify-center rounded-full text-ink-2 hover:bg-well hover:text-ink"
        >
          <X aria-hidden="true" className="size-4" />
        </Link>
      ) : null}
    </div>
  );
}
