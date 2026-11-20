/** Ancienneté d'un élément de la file de modération : « il y a 3 jours ». */

export type AgeUnit = "minute" | "hour" | "day" | "week" | "month";

const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

/** Ancienneté arrondie vers le bas, dans l'unité la plus parlante ; jamais moins d'une minute. */
export function ageOf(iso: string, now: Date): { value: number; unit: AgeUnit } {
  const elapsed = Math.max(0, now.getTime() - new Date(iso).getTime());
  if (elapsed < HOUR) return { value: Math.max(1, Math.floor(elapsed / MINUTE)), unit: "minute" };
  if (elapsed < DAY) return { value: Math.floor(elapsed / HOUR), unit: "hour" };
  if (elapsed < 14 * DAY) return { value: Math.floor(elapsed / DAY), unit: "day" };
  if (elapsed < 8 * 7 * DAY) return { value: Math.floor(elapsed / (7 * DAY)), unit: "week" };
  return { value: Math.floor(elapsed / (30 * DAY)), unit: "month" };
}

/**
 * « il y a 3 jours » / « قبل 3 أيام », en chiffres occidentaux (usage tunisien), avec une espace
 * insécable entre le nombre et son mot.
 */
export function formatAge(iso: string, now: Date, locale: string): string {
  const { value, unit } = ageOf(iso, now);
  const format = new Intl.RelativeTimeFormat(locale === "ar" ? "ar-TN-u-nu-latn" : "fr-FR", { numeric: "always" });
  return format.format(-value, unit).replace(/(\d) (?=\S)/g, "$1 ");
}
