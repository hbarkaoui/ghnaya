import type { ClubRole } from "./membership";

export interface Club {
  id: string;
  slug: string;
  name: string;
  inviteCode: string;
}

export interface ClubRef {
  slug: string;
  name: string;
}

export interface ClubSummary extends Club {
  memberCount: number;
  /** Rôle de l'utilisateur dans ce club. */
  role: ClubRole;
}

export interface ClubMember {
  id: string;
  name: string;
  role: ClubRole;
}
