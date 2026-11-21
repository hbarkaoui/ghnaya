import type { CurrentUser } from "./types";

/**
 * Qui peut faire quoi (spec §4.2 et §4.3) : le seul endroit où l'on en décide. Les pages s'en servent pour
 * afficher ou non une action, et les Server Actions pour la refuser. Fonctions pures, sans accès à la base :
 * l'appelant leur passe l'utilisateur courant (`getCurrentUser`) et l'objet visé, lus juste avant.
 */

export const canModerate = (user: CurrentUser | null): boolean => user?.isModerator ?? false;

/** Créer un club : réservé aux animateurs, rôle attribué par un admin (spec §10). */
export const canCreateClub = (user: CurrentUser | null): boolean => user?.isAnimator ?? false;
