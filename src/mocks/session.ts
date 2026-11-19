import { PLAYLISTS } from "./catalog";

/**
 * Session fictive de la maquette, en attendant l'authentification (plan 2).
 * Un cookie de démonstration choisit l'un des trois cas, depuis /apercu/session.
 */
export const DEMO_SESSION_COOKIE = "ghnaya-demo-session";
export const DEMO_SESSIONS = ["member", "member-no-club", "visitor"] as const;
export type DemoSession = (typeof DEMO_SESSIONS)[number];

export interface DemoUser {
  id: string;
  name: string;
  clubSlugs: string[];
}

const LEILA: DemoUser = {
  id: "u-leila",
  name: "Leïla",
  clubSlugs: ["les-jasmins", "malouf-sfax", "chorale-du-bardo"],
};

export function demoUserFor(session: DemoSession): DemoUser | null {
  if (session === "visitor") return null;
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
