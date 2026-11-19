import type { ArtistRef, Dialect } from "./catalog";

/**
 * Propositions (spec §5, table `song_revisions`) : un ajout (`songId` nul) ou une correction d'une
 * chanson existante, relue par un modérateur.
 */
export const PROPOSAL_STATUSES = ["pending", "approved", "rejected"] as const;
export type ProposalStatus = (typeof PROPOSAL_STATUSES)[number];

/** Artiste proposé : un artiste existant (`id`), ou nouveau (`id` nul), créé à l'approbation. */
export type ProposedArtist = Pick<ArtistRef, "nameAr" | "nameLatin"> & { id: string | null };

/** Version complète proposée (`song_revisions.payload`). */
export interface ProposalPayload {
  titleAr: string | null;
  titleLatin: string | null;
  artists: ProposedArtist[];
  lyrics: string;
  lyricsTranslit: string | null;
  dialect: Dialect;
}

export interface Proposal {
  id: string;
  /** Chanson corrigée ; nul pour un ajout. */
  songId: string | null;
  authorId: string;
  payload: ProposalPayload;
  rightsDeclared: true;
  status: ProposalStatus;
  /** Note du modérateur, obligatoire en cas de refus. */
  reviewNote: string | null;
  /** ISO 8601. */
  createdAt: string;
  reviewedAt: string | null;
}
