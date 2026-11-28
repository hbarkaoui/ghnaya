import { timingSafeEqual } from "node:crypto";

/** Longueur minimale de `CRON_SECRET` : `openssl rand -base64 32` en donne 44. */
export const CRON_SECRET_MIN_LENGTH = 32;

/**
 * Vercel appelle les tâches planifiées avec `Authorization: Bearer <CRON_SECRET>`. Sans secret configuré
 * (ou trop court), la tâche ne tourne pas : n'importe qui pourrait sinon la déclencher.
 */
export function cronAuthorization(
  header: string | null,
  secret: string | undefined,
): "ok" | "denied" | "unconfigured" {
  const expected = secret?.trim() ?? "";
  if (expected.length < CRON_SECRET_MIN_LENGTH) return "unconfigured";
  const given = Buffer.from(header ?? "");
  const wanted = Buffer.from(`Bearer ${expected}`);
  return given.length === wanted.length && timingSafeEqual(given, wanted) ? "ok" : "denied";
}
