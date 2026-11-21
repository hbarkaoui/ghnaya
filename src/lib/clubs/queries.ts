import "server-only";
import { sql } from "drizzle-orm";
import type { ClubMembershipRef } from "@/lib/auth/types";
import type { ClubRole, Membership } from "@/lib/clubs/membership";
import type { Club, ClubMember, ClubRef, ClubSummary } from "@/lib/clubs/types";
import { db } from "@/lib/db/client";

/** Clubs de l'utilisateur, avec son rôle, dans l'ordre où il les a rejoints. */
export async function membershipsOf(userId: string): Promise<ClubMembershipRef[]> {
  const res = await db.execute<{ slug: string; name: string; role: ClubRole }>(sql`
    SELECT c.slug, c.name, m.role
    FROM club_members m JOIN clubs c ON c.id = m.club_id
    WHERE m.user_id = ${userId}
    ORDER BY m.created_at, c.slug`);
  return res.rows;
}

type ClubRow = { id: string; slug: string; name: string; invite_code: string };
const toClub = (r: ClubRow): Club => ({ id: r.id, slug: r.slug, name: r.name, inviteCode: r.invite_code });

export async function getClubBySlug(slug: string): Promise<Club | null> {
  const res = await db.execute<ClubRow>(sql`SELECT id, slug, name, invite_code FROM clubs WHERE slug = ${slug}`);
  return res.rows[0] ? toClub(res.rows[0]) : null;
}

/** Club d'un lien d'invitation. Le code est comparé en minuscules (`parseInviteCode` les produit). */
export async function getClubByInvite(code: string): Promise<Club | null> {
  const res = await db.execute<ClubRow>(
    sql`SELECT id, slug, name, invite_code FROM clubs WHERE invite_code = ${code.toLowerCase()}`,
  );
  return res.rows[0] ? toClub(res.rows[0]) : null;
}

export async function memberCountOf(clubId: string): Promise<number> {
  const res = await db.execute<{ n: string }>(sql`SELECT count(*) AS n FROM club_members WHERE club_id = ${clubId}`);
  return Number(res.rows[0].n);
}

/** Clubs de l'utilisateur, avec le nombre de membres et son rôle, dans l'ordre d'adhésion. */
export async function clubsOf(userId: string): Promise<ClubSummary[]> {
  const res = await db.execute<ClubRow & { role: ClubSummary["role"]; member_count: string }>(sql`
    SELECT c.id, c.slug, c.name, c.invite_code, m.role,
      (SELECT count(*) FROM club_members o WHERE o.club_id = c.id) AS member_count
    FROM club_members m JOIN clubs c ON c.id = m.club_id
    WHERE m.user_id = ${userId}
    ORDER BY m.created_at, c.slug`);
  return res.rows.map((r) => ({ ...toClub(r), role: r.role, memberCount: Number(r.member_count) }));
}

/** Membres du club : les animateurs d'abord, puis par ordre alphabétique dans la langue de l'interface. */
export async function membersOf(clubId: string, locale: string): Promise<ClubMember[]> {
  const res = await db.execute<{ id: string; name: string; role: ClubRole }>(sql`
    SELECT u.id, u.name, m.role
    FROM club_members m JOIN users u ON u.id = m.user_id
    WHERE m.club_id = ${clubId}`);
  const collator = new Intl.Collator(locale);
  return res.rows.sort((a, b) =>
    a.role === b.role ? collator.compare(a.name, b.name) : a.role === "animator" ? -1 : 1,
  );
}

/**
 * Ce que `decideJoin` doit savoir : les adhésions de l'utilisateur, et les animateurs de ses clubs
 * (pour la règle du dernier animateur).
 */
export async function joinMembershipsOf(userId: string): Promise<Membership[]> {
  const res = await db.execute<{ club_slug: string; user_id: string; role: Membership["role"] }>(sql`
    SELECT c.slug AS club_slug, m.user_id, m.role
    FROM club_members m JOIN clubs c ON c.id = m.club_id
    WHERE m.user_id = ${userId}
      OR (m.role = 'animator' AND m.club_id IN (SELECT club_id FROM club_members WHERE user_id = ${userId}))
    ORDER BY m.created_at`);
  return res.rows.map((r) => ({ clubSlug: r.club_slug, userId: r.user_id, role: r.role }));
}

/** Clubs dont l'utilisateur est le seul animateur (spec §12 : il ne peut pas supprimer son compte). */
export async function soleAnimatorClubs(userId: string): Promise<ClubRef[]> {
  const res = await db.execute<{ slug: string; name: string }>(sql`
    SELECT c.slug, c.name
    FROM club_members m JOIN clubs c ON c.id = m.club_id
    WHERE m.user_id = ${userId} AND m.role = 'animator'
      AND NOT EXISTS (
        SELECT 1 FROM club_members o
        WHERE o.club_id = m.club_id AND o.role = 'animator' AND o.user_id <> ${userId})
    ORDER BY m.created_at`);
  return res.rows;
}
