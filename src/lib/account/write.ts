import "server-only";
import { eq, sql } from "drizzle-orm";
import type { ClubRef } from "@/lib/clubs/types";
import type { Db } from "@/lib/db/client";
import { users } from "@/lib/db/schema";

export async function updateUserName(db: Db, userId: string, name: string): Promise<void> {
  await db.update(users).set({ name, updatedAt: new Date() }).where(eq(users.id, userId));
}

/** Langue de l'interface, gardée avec le compte (spec §5). Le cookie `locale` reste la source de l'affichage. */
export async function setUserLocale(db: Db, userId: string, locale: "fr" | "ar"): Promise<void> {
  await db.update(users).set({ locale, updatedAt: new Date() }).where(eq(users.id, userId));
}

export type DeleteAccountResult = { ok: true } | { ok: false; reason: "last-animator"; clubs: ClubRef[] };

/**
 * Supprime le compte (spec §12) : ses sessions, ses playlists personnelles et ses adhésions partent avec lui
 * (clés étrangères en cascade). Refusé tant qu'il est le seul animateur d'un club. Verrous : l'utilisateur,
 * puis par identifiant ses clubs et ceux qu'il a créés, comme l'adhésion (`lib/clubs/write`) : supprimer
 * l'utilisateur vide `clubs.created_by` (SET NULL), ce qui verrouille aussi ces clubs, et un verrou pris
 * hors de l'ordre pourrait se croiser avec une adhésion en cours. Ses propositions et ses signalements restent,
 * sans auteur : `ON DELETE SET NULL` les anonymise dans la même transaction (plan 3, écart 1).
 */
export function deleteUserAccount(db: Db, userId: string): Promise<DeleteAccountResult> {
  return db.transaction(async (tx) => {
    await tx.execute(sql`SELECT id FROM users WHERE id = ${userId} FOR UPDATE`);
    await tx.execute(sql`
      SELECT id FROM clubs
      WHERE id IN (SELECT club_id FROM club_members WHERE user_id = ${userId}) OR created_by = ${userId}
      ORDER BY id FOR UPDATE`);
    const sole = await tx.execute<{ slug: string; name: string }>(sql`
      SELECT c.slug, c.name
      FROM club_members m JOIN clubs c ON c.id = m.club_id
      WHERE m.user_id = ${userId} AND m.role = 'animator'
        AND NOT EXISTS (
          SELECT 1 FROM club_members o
          WHERE o.club_id = m.club_id AND o.role = 'animator' AND o.user_id <> ${userId})
      ORDER BY m.created_at`);
    if (sole.rows.length > 0) return { ok: false, reason: "last-animator", clubs: sole.rows };
    await tx.delete(users).where(eq(users.id, userId));
    return { ok: true };
  });
}
