import { toCurrentUser, type ClubMembershipRef, type GlobalRole } from "@/lib/auth/types";

/** Utilisateur courant de test : membre sans club par défaut. */
export const userWith = (over: { globalRole?: GlobalRole; isAnimator?: boolean; clubs?: ClubMembershipRef[] } = {}) =>
  toCurrentUser(
    { id: "u1", name: "Test", email: "t@example.com", globalRole: over.globalRole, isAnimator: over.isAnimator },
    over.clubs ?? [],
  );
