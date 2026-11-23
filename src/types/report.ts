import type { Song } from "./catalog";

/**
 * Signalements (spec §5, table `reports`). Les listes de valeurs sont partagées avec les enums du schéma
 * (`src/lib/db/schema.ts`), pour qu'il n'y en ait qu'une.
 */
export const REPORT_REASONS = ["copyright", "wrong_lyrics", "duplicate", "spam", "other"] as const;
export type ReportReason = (typeof REPORT_REASONS)[number];
export const REPORT_STATUSES = ["open", "resolved", "dismissed"] as const;
export type ReportStatus = (typeof REPORT_STATUSES)[number];

/** Signalement lu en base, avec la chanson visée (publiée ou retirée) et le nom des personnes. */
export interface Report {
  id: string;
  /** Auteur connecté ; `null` pour un visiteur, qui a laissé `contactEmail`, ou pour un compte supprimé depuis. */
  reporterId: string | null;
  reporterName: string | null;
  contactEmail: string | null;
  reason: ReportReason;
  details: string;
  status: ReportStatus;
  resolutionNote: string | null;
  resolvedByName: string | null;
  /** ISO 8601. */
  createdAt: string;
  song: Pick<Song, "id" | "titleAr" | "titleLatin" | "artists"> & { published: boolean };
}
