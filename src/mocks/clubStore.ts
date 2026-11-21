import { newInviteCode } from "@/lib/clubs/invite";
import { join, promoteToAnimator, type ClubRole, type Joiner, type JoinResult, type Membership } from "@/lib/clubs/membership";
import { clubSlug } from "@/lib/clubs/slug";
import type { Playlist } from "@/types/catalog";
import { PLAYLISTS } from "./catalog";

/**
 * Clubs fictifs, modifiables EN MÉMOIRE par les actions serveur (tâche 11), en attendant le back-end
 * (tables `clubs` et `club_members`, spec §5). Tout revient à l'état initial au redémarrage du serveur.
 *
 * Les playlists de club restent dans `PLAYLISTS` (catalog.ts), modifié en place : l'accueil et le lecteur
 * voient donc les playlists créées ou supprimées ici.
 */

export interface MockClub {
  slug: string;
  name: string;
  inviteCode: string;
}

export interface ClubMember {
  id: string;
  name: string;
  role: ClubRole;
}

export interface ClubSummary extends MockClub {
  memberCount: number;
  /** Rôle de l'utilisateur dans ce club. */
  role: ClubRole;
}

/** Personnes fictives (noms inventés). Leïla, Sami, Nour et Rania sont les sessions de démonstration. */
const PEOPLE: Record<string, string> = {
  "u-sami": "Sami",
  "u-leila": "Leïla",
  "u-nour": "Nour",
  "u-rania": "Rania",
  "u-amira": "Amira Ben Salah",
  "u-karim": "Karim Trabelsi",
  "u-selma": "سلمى",
  "u-hedi": "Hédi Jaziri",
  "u-youssef": "Youssef",
  "u-mohamed": "Mohamed Gharbi",
  "u-walid": "Walid Chaabane",
  "u-ines": "Inès",
  "u-olfa": "Olfa",
  "u-bilel": "بلال",
  "u-mariem": "مريم الزواري",
  "u-rim": "Rim Saïdi",
  "u-aziz": "Aziz",
  "u-dorra": "درة",
};

/** Codes fixes pour la démonstration : /rejoindre/nghw5ntz7a invite dans un club où personne des démos n'est. */
const SEED_CLUBS: MockClub[] = [
  { slug: "les-jasmins", name: "Les Jasmins", inviteCode: "q7jasmyn42" },
  { slug: "malouf-sfax", name: "Malouf Sfax", inviteCode: "h4ttzr8wpc" },
  { slug: "chorale-du-bardo", name: "Chorale du Bardo", inviteCode: "b6rdq9kmxe" },
  { slug: "nghanniw", name: "Nghanniw", inviteCode: "nghw5ntz7a" },
];

const member = (clubSlug: string, userId: string, role: ClubRole = "member"): Membership => ({ clubSlug, userId, role });

const SEED_MEMBERSHIPS: Membership[] = [
  member("les-jasmins", "u-sami", "animator"),
  member("les-jasmins", "u-leila"),
  member("les-jasmins", "u-rania"),
  member("les-jasmins", "u-amira"),
  member("les-jasmins", "u-karim"),
  member("les-jasmins", "u-selma"),
  member("les-jasmins", "u-hedi"),
  member("les-jasmins", "u-youssef"),
  member("malouf-sfax", "u-sami", "animator"),
  member("malouf-sfax", "u-mohamed", "animator"),
  member("malouf-sfax", "u-walid"),
  member("malouf-sfax", "u-ines"),
  member("chorale-du-bardo", "u-sami", "animator"),
  member("chorale-du-bardo", "u-olfa"),
  member("chorale-du-bardo", "u-bilel"),
  member("chorale-du-bardo", "u-mariem"),
  member("nghanniw", "u-rim", "animator"),
  member("nghanniw", "u-aziz"),
  member("nghanniw", "u-dorra"),
];

const SEED_PLAYLISTS: Playlist[] = structuredClone(PLAYLISTS);

const state = {
  clubs: structuredClone(SEED_CLUBS),
  memberships: structuredClone(SEED_MEMBERSHIPS),
};

const byMostRecent = (a: Playlist, b: Playlist) => b.updatedAt.localeCompare(a.updatedAt);

// ---------- Lecture ----------

export const getClub = (slug: string): MockClub | undefined => state.clubs.find((c) => c.slug === slug);

export const getClubByInvite = (code: string): MockClub | undefined => state.clubs.find((c) => c.inviteCode === code);

export const memberships = (): readonly Membership[] => state.memberships;

/** Clubs de l'utilisateur, dans l'ordre où il les a rejoints. */
export const clubSlugsOf = (userId: string): string[] =>
  state.memberships.filter((m) => m.userId === userId).map((m) => m.clubSlug);

export const roleIn = (slug: string, userId: string): ClubRole | null =>
  state.memberships.find((m) => m.clubSlug === slug && m.userId === userId)?.role ?? null;

const memberCount = (slug: string) => state.memberships.filter((m) => m.clubSlug === slug).length;

export const clubSummary = (club: MockClub, userId: string): ClubSummary => ({
  ...club,
  memberCount: memberCount(club.slug),
  role: roleIn(club.slug, userId) ?? "member",
});

/** Clubs de l'utilisateur, avec le nombre de membres et son rôle. */
export const clubsOf = (userId: string): ClubSummary[] =>
  clubSlugsOf(userId).flatMap((slug) => {
    const club = getClub(slug);
    return club ? [clubSummary(club, userId)] : [];
  });

/** Membres du club : les animateurs d'abord, puis par ordre alphabétique. */
export function membersOf(slug: string, locale: string): ClubMember[] {
  const collator = new Intl.Collator(locale);
  return state.memberships
    .filter((m) => m.clubSlug === slug)
    .map((m) => ({ id: m.userId, name: PEOPLE[m.userId] ?? m.userId, role: m.role }))
    .sort((a, b) => (a.role === b.role ? collator.compare(a.name, b.name) : a.role === "animator" ? -1 : 1));
}

/** Playlists du club, de la plus récemment modifiée à la plus ancienne. */
export const clubPlaylists = (slug: string): Playlist[] =>
  PLAYLISTS.filter((p) => p.club?.slug === slug).sort(byMostRecent);

// ---------- Modifications (appelées par les actions serveur, après les contrôles de droits) ----------

/** Crée le club ; son créateur en devient l'animateur (spec §10). */
export function createClub(name: string, creatorId: string): MockClub {
  const taken = state.clubs.map((c) => c.slug);
  const club: MockClub = { slug: clubSlug(name, taken), name, inviteCode: uniqueInviteCode() };
  state.clubs.push(club);
  state.memberships.push(member(club.slug, creatorId, "animator"));
  return club;
}

/** Renomme le club. Le slug ne change pas, pour que les liens déjà partagés restent valides. */
export function renameClub(slug: string, name: string): void {
  const club = getClub(slug);
  if (!club) return;
  club.name = name;
  for (const playlist of PLAYLISTS) if (playlist.club?.slug === slug) playlist.club = { slug, name };
}

/** Nouveau code d'invitation : l'ancien lien ne fonctionne plus. */
export function regenerateInvite(slug: string): void {
  const club = getClub(slug);
  if (club) club.inviteCode = uniqueInviteCode();
}

/** Supprime le club, ses adhésions et ses playlists (les copies personnelles des membres restent). */
export function deleteClub(slug: string): void {
  state.clubs = state.clubs.filter((c) => c.slug !== slug);
  state.memberships = state.memberships.filter((m) => m.clubSlug !== slug);
  const kept = PLAYLISTS.filter((p) => p.club?.slug !== slug);
  PLAYLISTS.splice(0, PLAYLISTS.length, ...kept);
}

export function promote(slug: string, userId: string): void {
  state.memberships = promoteToAnimator(state.memberships, slug, userId);
}

/** Rejoint le club selon la règle des clubs (lib/clubs/membership). */
export function joinClub(user: Joiner, slug: string): JoinResult {
  const result = join(state.memberships, user, slug);
  if (result.ok) state.memberships = result.memberships;
  return result;
}

/** Nouvelle playlist de club, vide, en tête des playlists du club. */
export function createClubPlaylist(slug: string, name: string): Playlist | null {
  const club = getClub(slug);
  if (!club) return null;
  const playlist: Playlist = {
    id: `p-${crypto.randomUUID()}`,
    name,
    club: { slug, name: club.name },
    ownerId: null,
    items: [],
    updatedAt: new Date().toISOString(),
  };
  PLAYLISTS.push(playlist);
  return playlist;
}

/** MAQUETTE : revient aux clubs, aux adhésions et aux playlists de départ. */
export function resetClubStore(): void {
  state.clubs = structuredClone(SEED_CLUBS);
  state.memberships = structuredClone(SEED_MEMBERSHIPS);
  PLAYLISTS.splice(0, PLAYLISTS.length, ...structuredClone(SEED_PLAYLISTS));
}

function uniqueInviteCode(): string {
  let code = newInviteCode();
  while (getClubByInvite(code)) code = newInviteCode();
  return code;
}
