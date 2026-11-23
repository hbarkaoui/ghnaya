import "server-only";
import { hitRateLimit } from "@/lib/ratelimit/fixedWindow";

const DAY_SECONDS = 24 * 60 * 60;

/** Spec §8.7 et §12 : 10 propositions par jour et par utilisateur, 10 signalements par jour et par IP (écart 8). */
export const REVISION_LIMIT = { limit: 10, windowSeconds: DAY_SECONDS } as const;
export const REPORT_LIMIT = { limit: 10, windowSeconds: DAY_SECONDS } as const;

/** Compte une proposition de plus pour l'utilisateur ; `false` au-delà de la limite du jour. */
export async function allowRevision(userId: string): Promise<boolean> {
  const { allowed } = await hitRateLimit(`revision:${userId}`, REVISION_LIMIT.limit, REVISION_LIMIT.windowSeconds);
  return allowed;
}

/** Compte un signalement de plus depuis cette adresse IP ; `false` au-delà de la limite du jour. */
export async function allowReport(ip: string): Promise<boolean> {
  const { allowed } = await hitRateLimit(`report:${ip}`, REPORT_LIMIT.limit, REPORT_LIMIT.windowSeconds);
  return allowed;
}

/** L'autocomplétion des artistes interroge la base à chaque frappe : 120 requêtes par minute et par personne. */
export const ARTIST_SUGGEST_LIMIT = { limit: 120, windowSeconds: 60 } as const;

export async function allowArtistSuggestion(userId: string): Promise<boolean> {
  const { allowed } = await hitRateLimit(
    `artists:${userId}`,
    ARTIST_SUGGEST_LIMIT.limit,
    ARTIST_SUGGEST_LIMIT.windowSeconds,
  );
  return allowed;
}
