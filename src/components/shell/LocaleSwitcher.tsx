import { getLocale, getTranslations } from "next-intl/server";
import { setLocale } from "@/app/actions/locale";

const OPTIONS = [
  { value: "fr", short: "FR", lang: "fr" },
  { value: "ar", short: "ع", lang: "ar" },
] as const;

/** Bascule FR · ع : un formulaire, deux boutons ; la langue active est marquée aria-pressed. */
export async function LocaleSwitcher() {
  const locale = await getLocale();
  const t = await getTranslations("locale");

  return (
    <form
      action={setLocale}
      aria-label={t("label")}
      className="flex items-center rounded-md border border-line p-0.5"
    >
      {OPTIONS.map((option) => {
        const current = option.value === locale;
        return (
          <button
            key={option.value}
            type="submit"
            name="locale"
            value={option.value}
            aria-pressed={current}
            aria-label={t(option.value)}
            lang={option.lang}
            className={`min-h-11 min-w-11 rounded-sm px-2 text-sm font-medium transition-colors duration-(--duration-fast) ${
              current ? "bg-inverse text-ink-inverse" : "text-ink-2 hover:text-ink"
            }`}
          >
            <span aria-hidden="true">{option.short}</span>
          </button>
        );
      })}
    </form>
  );
}
