import type { ClubRole } from "@/lib/clubs/membership";

/**
 * Utilisateur connecté, tel que les pages et les actions le voient (plan 2). Remplace `DemoUser` de la
 * maquette, avec les mêmes champs (`isAnimator`, `isModerator`, `clubSlugs`), plus les rôles par club.
 */
export const GLOBAL_ROLES = ["member", "moderator", "admin"] as const;
export type GlobalRole = (typeof GLOBAL_ROLES)[number];

export interface ClubMembershipRef {
  slug: string;
  name: string;
  /** Rôle dans ce club (`club_members.role`) : c'est lui qui donne le droit de modifier ses playlists. */
  role: ClubRole;
}

export interface CurrentUser {
  id: string;
  name: string;
  email: string;
  locale: "fr" | "ar";
  /** Adresse vérifiée (lien magique, ou Google qui l'atteste) : exigée pour proposer (spec §8.7). */
  emailVerified: boolean;
  globalRole: GlobalRole;
  /** Attribué par un admin : créer des clubs et en animer plusieurs (spec §4.3). */
  isAnimator: boolean;
  /** Modérateur ou admin. */
  isModerator: boolean;
  /** Clubs dans l'ordre d'adhésion (un seul pour un membre). */
  clubs: ClubMembershipRef[];
  clubSlugs: string[];
}

interface SessionUserFields {
  id: string;
  name: string;
  email: string;
  globalRole?: unknown;
  isAnimator?: unknown;
  locale?: unknown;
  emailVerified?: unknown;
}

const isGlobalRole = (value: unknown): value is GlobalRole => GLOBAL_ROLES.includes(value as GlobalRole);

export function toCurrentUser(user: SessionUserFields, clubs: ClubMembershipRef[]): CurrentUser {
  const globalRole = isGlobalRole(user.globalRole) ? user.globalRole : "member";
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    locale: user.locale === "ar" ? "ar" : "fr",
    emailVerified: user.emailVerified === true,
    globalRole,
    isAnimator: user.isAnimator === true,
    isModerator: globalRole !== "member",
    clubs,
    clubSlugs: clubs.map((club) => club.slug),
  };
}
