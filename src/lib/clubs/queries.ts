import "server-only";
import { sql } from "drizzle-orm";
import type { ClubMembershipRef } from "@/lib/auth/types";
import type { ClubRole } from "@/lib/clubs/membership";
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
