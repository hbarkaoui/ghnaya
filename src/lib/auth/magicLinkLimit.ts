import "server-only";
import { hitRateLimit } from "@/lib/ratelimit/fixedWindow";

/** Écart 4 du plan 2 : limite des liens magiques, en base, par adresse et par IP. */
export const MAGIC_LINK_LIMITS = {
  perEmail: { limit: 5, windowSeconds: 15 * 60 },
  perIp: { limit: 20, windowSeconds: 60 * 60 },
} as const;

export async function allowMagicLinkRequest(email: string, ip: string): Promise<boolean> {
  const byIp = await hitRateLimit(`magic-link-ip:${ip}`, MAGIC_LINK_LIMITS.perIp.limit, MAGIC_LINK_LIMITS.perIp.windowSeconds);
  if (!byIp.allowed) return false;
  const byEmail = await hitRateLimit(
    `magic-link-email:${email}`,
    MAGIC_LINK_LIMITS.perEmail.limit,
    MAGIC_LINK_LIMITS.perEmail.windowSeconds,
  );
  return byEmail.allowed;
}
