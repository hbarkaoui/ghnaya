import { PLAYLISTS } from "./catalog";

/**
 * Session fictive de la maquette, en attendant l'authentification (plan 2).
 * Un cookie de démonstration choisit l'un des cas, depuis /apercu/session.
 *
 * Règle des clubs (rectification du 19/11/2026) : un membre appartient à un seul club ; seul un
 * animateur (rôle attribué par un admin) crée des clubs et en anime plusieurs.
 */
export const DEMO_SESSION_COOKIE = "ghnaya-demo-session";
export const DEMO_SESSIONS = ["member", "animator", "member-no-club", "visitor", "moderator"] as const;
export type DemoSession = (typeof DEMO_SESSIONS)[number];

export interface DemoUser {
  id: string;
  name: string;
  /** Rôle d'animateur attribué par un admin (`users.is_animator`) : créer et animer plusieurs clubs. */
  isAnimator: boolean;
  /** Un seul club pour un membre ; plusieurs possibles pour un animateur. */
  clubSlugs: string[];
  /** Rôle global de modérateur attribué par un admin (spec §4.3). Absent : pas modérateur. */
  isModerator?: boolean;
}

const LEILA: DemoUser = { id: "u-leila", name: "Leïla", isAnimator: false, clubSlugs: ["les-jasmins"] };

const SAMI: DemoUser = {
  id: "u-sami",
  name: "Sami",
  isAnimator: true,
  clubSlugs: ["les-jasmins", "malouf-sfax", "chorale-du-bardo"],
};

/** Session « moderator » : Nour, membre ordinaire des Jasmins, qui relit aussi les propositions (tâche 12). */
const NOUR: DemoUser = { id: "u-nour", name: "Nour", isAnimator: false, clubSlugs: ["les-jasmins"], isModerator: true };

export function demoUserFor(session: DemoSession): DemoUser | null {
  if (session === "visitor") return null;
  if (session === "moderator") return NOUR;
  if (session === "animator") return SAMI;
  if (session === "member-no-club") return { ...LEILA, clubSlugs: [] };
  return LEILA;
}

export const isDemoSession = (value: string | undefined): value is DemoSession =>
  DEMO_SESSIONS.includes(value as DemoSession);

const byMostRecent = (a: { updatedAt: string }, b: { updatedAt: string }) => b.updatedAt.localeCompare(a.updatedAt);

/** Playlists des clubs de l'utilisateur, de la plus récemment modifiée à la plus ancienne. */
export const clubPlaylistsFor = (user: DemoUser) =>
  PLAYLISTS.filter((p) => p.club && user.clubSlugs.includes(p.club.slug)).sort(byMostRecent);

/** Dans la maquette, toutes les playlists personnelles appartiennent à Leïla. */
const PERSONAL_PLAYLISTS_OWNER = LEILA.id;

/** Playlists personnelles de l'utilisateur, de la plus récemment modifiée à la plus ancienne. */
export const personalPlaylistsFor = (user: DemoUser) =>
  user.id === PERSONAL_PLAYLISTS_OWNER ? PLAYLISTS.filter((p) => p.club === null).sort(byMostRecent) : [];
