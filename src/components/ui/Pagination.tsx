import { ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import { getTranslations } from "next-intl/server";

const LINK_CLASS =
  "inline-flex min-h-11 items-center gap-1 rounded-md border border-line px-3 font-medium text-ink hover:bg-well";

/**
 * Pagination « Précédent · Page 2 sur 5 · Suivant ». Les chevrons sont retournés en arabe.
 * Rien n'est affiché s'il n'y a qu'une page.
 */
export async function Pagination({
  page,
  lastPage,
  hrefFor,
}: {
  page: number;
  lastPage: number;
  hrefFor: (page: number) => string;
}) {
  if (lastPage <= 1) return null;
  const t = await getTranslations("pagination");

  return (
    <nav aria-label={t("label")} className="mt-6 grid grid-cols-[1fr_auto_1fr] items-center gap-3">
      <div className="justify-self-start">
        {page > 1 ? (
          <Link href={hrefFor(page - 1)} rel="prev" className={`${LINK_CLASS} pe-4`}>
            <ChevronLeft aria-hidden="true" className="size-5 rtl:-scale-x-100" />
            {t("previous")}
          </Link>
        ) : null}
      </div>
      <p className="text-sm text-ink-2">
        {t("position", { current: String(page), total: String(lastPage) })}
      </p>
      <div className="justify-self-end">
        {page < lastPage ? (
          <Link href={hrefFor(page + 1)} rel="next" className={`${LINK_CLASS} ps-4`}>
            {t("next")}
            <ChevronRight aria-hidden="true" className="size-5 rtl:-scale-x-100" />
          </Link>
        ) : null}
      </div>
    </nav>
  );
}
