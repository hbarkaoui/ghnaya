import { eq, sql } from "drizzle-orm";
import { checkEmail } from "@/lib/auth/email";
import { GLOBAL_ROLES, type GlobalRole } from "@/lib/auth/types";
import type { ClubRef } from "@/lib/clubs/types";
import type { Db } from "@/lib/db/client";
import { users } from "@/lib/db/schema";

/** Rôles attribués par un admin (spec §4.3, écart 5 du plan 2) : rôle global et rôle d'animateur. */
export interface RoleChange {
  globalRole?: GlobalRole;
  isAnimator?: boolean;
}

export type RoleArgs = { ok: true; email: string; change: RoleChange } | { ok: false; error: string };

const USAGE = "Usage : pnpm user:role <email> [--animator | --no-animator] [--role member|moderator|admin]";

export function parseRoleArgs(argv: string[]): RoleArgs {
  const [rawEmail, ...flags] = argv;
  const email = checkEmail(rawEmail);
  if (!email.ok) return { ok: false, error: USAGE };

  const change: RoleChange = {};
  for (let i = 0; i < flags.length; i += 1) {
    const flag = flags[i];
    if (flag === "--animator") change.isAnimator = true;
    else if (flag === "--no-animator") change.isAnimator = false;
    else if (flag === "--role" && GLOBAL_ROLES.includes(flags[i + 1] as GlobalRole)) {
      change.globalRole = flags[i + 1] as GlobalRole;
      i += 1;
    } else return { ok: false, error: USAGE };
  }
  if (change.globalRole === undefined && change.isAnimator === undefined) return { ok: false, error: USAGE };
  return { ok: true, email: email.email, change };
}

export async function setUserRoles(db: Db, email: string, change: RoleChange) {
  const [row] = await db
    .update(users)
    .set({ ...change, updatedAt: new Date() })
    .where(eq(users.email, email))
    .returning({ email: users.email, globalRole: users.globalRole, isAnimator: users.isAnimator });
  return row ?? null;
}

/** Clubs du compte à cette adresse, dans l'ordre d'adhésion. */
export async function clubsOfEmail(db: Db, email: string): Promise<ClubRef[]> {
  const res = await db.execute<{ slug: string; name: string }>(sql`
    SELECT c.slug, c.name
    FROM users u JOIN club_members m ON m.user_id = u.id JOIN clubs c ON c.id = m.club_id
    WHERE u.email = ${email}
    ORDER BY m.created_at, c.slug`);
  return res.rows;
}

/**
 * Après `--no-animator` : un membre n'a qu'un club, mais la règle ne s'applique qu'à sa prochaine adhésion.
 * S'il est encore dans plusieurs clubs, l'admin est prévenu (rien n'est retiré).
 */
export function noAnimatorWarning(email: string, clubs: ClubRef[]): string | null {
  if (clubs.length <= 1) return null;
  const list = clubs.map((club) => `${club.name} (${club.slug})`).join(", ");
  return (
    `Attention : ${email} n'est plus animateur mais reste dans ${clubs.length} clubs : ${list}. ` +
    "La règle d'un seul club ne s'appliquera qu'à sa prochaine adhésion."
  );
}
