// Plan 2, tâche 1 : fabriques des tests d'intégration (utilisateurs, clubs, chansons).
import { db } from "@/lib/db/client";
import { clubMembers, clubs, songs, users } from "@/lib/db/schema";

export type NewUser = typeof users.$inferInsert;

let counter = 0;
const next = () => (counter += 1);

export async function insertUser(overrides: Partial<NewUser> = {}) {
  const n = next();
  const [row] = await db
    .insert(users)
    .values({ name: `Personne ${n}`, email: `personne${n}@example.com`, emailVerified: true, ...overrides })
    .returning({ id: users.id, email: users.email, name: users.name });
  return row;
}

export async function insertClub(input: {
  name: string;
  slug?: string;
  inviteCode?: string;
  animatorIds: string[];
  memberIds?: string[];
}) {
  const n = next();
  const [club] = await db
    .insert(clubs)
    .values({
      name: input.name,
      slug: input.slug ?? `club-${n}`,
      inviteCode: input.inviteCode ?? `code${String(n).padStart(6, "0")}`,
      createdBy: input.animatorIds[0] ?? null,
    })
    .returning({ id: clubs.id, slug: clubs.slug, inviteCode: clubs.inviteCode });
  const rows = [
    ...input.animatorIds.map((userId) => ({ clubId: club.id, userId, role: "animator" as const })),
    ...(input.memberIds ?? []).map((userId) => ({ clubId: club.id, userId, role: "member" as const })),
  ];
  if (rows.length > 0) await db.insert(clubMembers).values(rows);
  return club;
}

/** Chanson publiée minimale (les colonnes de recherche restent vides : ces tests ne cherchent pas). */
export async function insertSong(title: string): Promise<string> {
  const n = next();
  const [row] = await db
    .insert(songs)
    .values({ titleLatin: title, lyrics: "سطر\nسطر", source: "public_domain", sourceRef: `test-${n}`, dedupeKey: `test-${n}` })
    .returning({ id: songs.id });
  return row.id;
}
