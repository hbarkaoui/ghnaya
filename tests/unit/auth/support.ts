import { toCurrentUser, type ClubMembershipRef, type GlobalRole } from "@/lib/auth/types";

/** Utilisateur courant de test : membre sans club, à l'adresse vérifiée, par défaut. */
export const userWith = (
  over: { globalRole?: GlobalRole; isAnimator?: boolean; emailVerified?: boolean; clubs?: ClubMembershipRef[] } = {},
) =>
  toCurrentUser(
    {
      id: "u1",
      name: "Test",
      email: "t@example.com",
      emailVerified: over.emailVerified ?? true,
      globalRole: over.globalRole,
      isAnimator: over.isAnimator,
    },
    over.clubs ?? [],
  );
