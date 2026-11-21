import type { ClubRole } from "@/lib/clubs/membership";
import type { ClubRef } from "@/lib/clubs/types";
import type { CurrentUser } from "./types";

/**
 * Qui peut faire quoi (spec §4.2 et §4.3) : le seul endroit où l'on en décide. Les pages s'en servent pour
 * afficher ou non une action, et les Server Actions pour la refuser. Fonctions pures, sans accès à la base :
 * l'appelant leur passe l'utilisateur courant (`getCurrentUser`) et l'objet visé, lus juste avant.
 */

export const canModerate = (user: CurrentUser | null): boolean => user?.isModerator ?? false;

/** Créer un club : réservé aux animateurs, rôle attribué par un admin (spec §10). */
export const canCreateClub = (user: CurrentUser | null): boolean => user?.isAnimator ?? false;

/** Rôle de l'utilisateur dans ce club (`club_members.role`), ou `null` s'il n'en est pas membre. */
export const clubRoleOf = (user: CurrentUser | null, slug: string): ClubRole | null =>
  user?.clubs.find((club) => club.slug === slug)?.role ?? null;

/** Renommer, inviter, promouvoir, supprimer, gérer les playlists du club : ses animateurs (spec §4.3). */
export const canManageClub = (user: CurrentUser | null, slug: string): boolean => clubRoleOf(user, slug) === "animator";

/** Clubs où l'utilisateur peut créer une playlist : ceux qu'il anime. */
export const clubsAnimatedBy = (user: CurrentUser | null): ClubRef[] =>
  (user?.clubs ?? []).filter((club) => club.role === "animator").map(({ slug, name }) => ({ slug, name }));
