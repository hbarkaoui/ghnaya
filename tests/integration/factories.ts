// Plan 2, tâche 1 : fabriques des tests d'intégration (utilisateurs, clubs, chansons).
import { db } from "@/lib/db/client";
import { clubMembers, clubs, reports, songRevisions, songs, users } from "@/lib/db/schema";
import type { ProposalPayload } from "@/types/proposal";
import type { ReportReason } from "@/types/report";

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

/** Proposition d'ajout minimale : un artiste connu des données de test (Hedi Jouini), deux vers. */
export const PAYLOAD: ProposalPayload = {
  titleAr: "لاموني اللي غاروا مني",
  titleLatin: "Lamouni Elli Gharou Menni",
  artists: [{ id: null, nameAr: null, nameLatin: "Hedi Jouini" }],
  lyrics: "قالوا عليّ كلام كثير\nوأنا نغنّي ونسامح",
  lyricsTranslit: null,
  dialect: "tn",
};

/** Proposition en attente : un ajout, ou une correction si `songId` est donné. */
export async function insertRevision(input: {
  authorId: string | null;
  songId?: string | null;
  payload?: ProposalPayload;
  createdAt?: Date;
}): Promise<string> {
  const [row] = await db
    .insert(songRevisions)
    .values({
      authorId: input.authorId,
      songId: input.songId ?? null,
      payload: input.payload ?? PAYLOAD,
      rightsDeclared: true,
      ...(input.createdAt ? { createdAt: input.createdAt } : {}),
    })
    .returning({ id: songRevisions.id });
  return row.id;
}

/** Signalement ouvert ; sans auteur, celui d'un visiteur qui a laissé son adresse. */
export async function insertReport(input: {
  songId: string;
  reason?: ReportReason;
  reporterId?: string | null;
  contactEmail?: string | null;
  details?: string;
  createdAt?: Date;
}): Promise<string> {
  const [row] = await db
    .insert(reports)
    .values({
      songId: input.songId,
      reason: input.reason ?? "wrong_lyrics",
      reporterId: input.reporterId ?? null,
      contactEmail: input.contactEmail ?? (input.reporterId ? null : "visiteur@example.com"),
      details: input.details ?? "Deux vers sont inversés.",
      ...(input.createdAt ? { createdAt: input.createdAt } : {}),
    })
    .returning({ id: reports.id });
  return row.id;
}
