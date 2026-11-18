export const LOCALES = ["fr", "ar"] as const;
export type Locale = (typeof LOCALES)[number];
export const LOCALE_COOKIE = "locale";

/** Le cookie l'emporte, puis l'en-tête Accept-Language, puis le français. */
export function pickLocale(cookie: string | undefined, acceptLanguage: string | null): Locale {
  if (cookie === "fr" || cookie === "ar") return cookie;
  return acceptLanguage?.trim().toLowerCase().startsWith("ar") ? "ar" : "fr";
}

export const isRtl = (locale: string): boolean => locale === "ar";
