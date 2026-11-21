import "server-only";
import { and, eq, sql } from "drizzle-orm";
import type { Db } from "@/lib/db/client";
import { isUniqueViolation } from "@/lib/db/errors";
import { clubMembers, clubs } from "@/lib/db/schema";
import { inList } from "@/lib/db/sqlList";
import { newInviteCode } from "./invite";
import { decideJoin, type Joiner, type Membership } from "./membership";
import { clubSlug, clubSlugBase } from "./slug";
import type { Club } from "./types";

/**
 * Écritures des clubs (spec §10). L'appelant (Server Action) a déjà vérifié les droits avec
 * `lib/auth/permissions`. La règle des clubs est appliquée ici, sous verrou, dans la transaction d'adhésion.
 */

const ATTEMPTS = 5;

/** Rejoue `fn` quand une contrainte d'unicité refuse un slug ou un code tiré au même moment par un autre. */
async function retryOnConflict<T>(fn: () => Promise<T>): Promise<T> {
  for (let attempt = 1; ; attempt += 1) {
    try {
      return await fn();
    } catch (error) {
      if (!isUniqueViolation(error) || attempt === ATTEMPTS) throw error;
    }
  }
}

export function createClub(db: Db, name: string, creatorId: string): Promise<Club> {
  return retryOnConflict(() =>
    db.transaction(async (tx) => {
      // Les slugs ne contiennent que des lettres, des chiffres et des tirets : pas de % ni de _ à échapper.
      const base = clubSlugBase(name);
      const taken = await tx.execute<{ slug: string }>(
        sql`SELECT slug FROM clubs WHERE slug = ${base} OR slug LIKE ${`${base}-%`}`,
      );
      const [club] = await tx
        .insert(clubs)
        .values({ name, slug: clubSlug(name, taken.rows.map((r) => r.slug)), inviteCode: newInviteCode(), createdBy: creatorId })
        .returning({ id: clubs.id, slug: clubs.slug, name: clubs.name, inviteCode: clubs.inviteCode });
      await tx.insert(clubMembers).values({ clubId: club.id, userId: creatorId, role: "animator" });
      return club;
    }),
  );
}

/** Le slug ne change pas, pour que les liens déjà partagés restent valides. */
export async function renameClub(db: Db, clubId: string, name: string): Promise<void> {
  await db.update(clubs).set({ name, updatedAt: new Date() }).where(eq(clubs.id, clubId));
}

/** Nouveau code d'invitation : l'ancien lien ne fonctionne plus. */
export function regenerateInvite(db: Db, clubId: string): Promise<string> {
  return retryOnConflict(async () => {
    const inviteCode = newInviteCode();
    await db.update(clubs).set({ inviteCode, updatedAt: new Date() }).where(eq(clubs.id, clubId));
    return inviteCode;
  });
}

/** Supprime le club, ses adhésions et ses playlists. Les copies personnelles des membres restent. */
export async function deleteClub(db: Db, clubId: string): Promise<void> {
  await db.delete(clubs).where(eq(clubs.id, clubId));
}

/** Donne le rôle d'animateur du club à l'un de ses membres. `false` s'il n'est pas un simple membre. */
export async function promoteMember(db: Db, clubId: string, userId: string): Promise<boolean> {
  const rows = await db
    .update(clubMembers)
    .set({ role: "animator", updatedAt: new Date() })
    .where(and(eq(clubMembers.clubId, clubId), eq(clubMembers.userId, userId), eq(clubMembers.role, "member")))
    .returning({ userId: clubMembers.userId });
  return rows.length === 1;
}

export type JoinOutcome =
  | { ok: true; club: Club; left: string[] }
  | { ok: false; reason: "invalid" | "already-member" | "needs-confirm" }
  | { ok: false; reason: "last-animator"; club: string };

/**
 * Rejoint le club du code d'invitation (spec §10). Verrous, toujours dans le même ordre pour éviter les
 * interblocages : la ligne de l'utilisateur (deux adhésions du même compte se suivent), puis le club visé et
 * ses clubs actuels, par identifiant (deux animateurs d'un club ne peuvent pas le quitter en même temps).
 */
export function joinClub(db: Db, user: Joiner, code: string, confirmed: boolean): Promise<JoinOutcome> {
  return db.transaction(async (tx) => {
    await tx.execute(sql`SELECT id FROM users WHERE id = ${user.id} FOR UPDATE`);

    const target = await tx.execute<{ id: string }>(sql`SELECT id FROM clubs WHERE invite_code = ${code.toLowerCase()}`);
    const targetId = target.rows[0]?.id;
    if (!targetId) return { ok: false, reason: "invalid" };

    const own = await tx.execute<{ club_id: string }>(sql`SELECT club_id FROM club_members WHERE user_id = ${user.id}`);
    const ids = [...new Set([targetId, ...own.rows.map((r) => r.club_id)])];
    await tx.execute(sql`SELECT id FROM clubs WHERE id IN (${inList(ids)}) ORDER BY id FOR UPDATE`);

    // Relu sous verrou : le code a pu être régénéré entre-temps.
    const locked = await tx.execute<{ id: string; slug: string; name: string; invite_code: string }>(
      sql`SELECT id, slug, name, invite_code FROM clubs WHERE id = ${targetId} AND invite_code = ${code.toLowerCase()}`,
    );
    const row = locked.rows[0];
    if (!row) return { ok: false, reason: "invalid" };
    const club: Club = { id: row.id, slug: row.slug, name: row.name, inviteCode: row.invite_code };

    const memberships = await tx.execute<{ club_slug: string; user_id: string; role: Membership["role"] }>(sql`
      SELECT c.slug AS club_slug, m.user_id, m.role
      FROM club_members m JOIN clubs c ON c.id = m.club_id
      WHERE m.user_id = ${user.id}
        OR (m.role = 'animator' AND m.club_id IN (SELECT club_id FROM club_members WHERE user_id = ${user.id}))`);
    const decision = decideJoin(
      memberships.rows.map((r) => ({ clubSlug: r.club_slug, userId: r.user_id, role: r.role })),
      user,
      club.slug,
    );

    if (decision.kind === "already-member") return { ok: false, reason: "already-member" };
    if (decision.kind === "blocked") return { ok: false, reason: "last-animator", club: decision.club };
    if (decision.kind === "switch" && !confirmed) return { ok: false, reason: "needs-confirm" };

    const left = decision.kind === "switch" ? decision.leaving : [];
    if (left.length > 0) {
      await tx.execute(sql`
        DELETE FROM club_members
        WHERE user_id = ${user.id} AND club_id IN (SELECT id FROM clubs WHERE slug IN (${inList(left)}))`);
    }
    await tx.insert(clubMembers).values({ clubId: club.id, userId: user.id, role: "member" });
    return { ok: true, club, left };
  });
}
