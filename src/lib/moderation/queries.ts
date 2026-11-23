import "server-only";
import { sql, type SQL } from "drizzle-orm";
import { isUuid } from "@/lib/catalog/queries";
import { db } from "@/lib/db/client";
import type { ProposalPayload, ProposalStatus, Revision, RevisionSummary } from "@/types/proposal";

/**
 * Lectures de la modération (spec §8, §9) : Mes contributions, la file des propositions, une proposition,
 * et la taille des files. Les listes ne lisent pas les paroles.
 */

const iso = (value: Date | string): string => new Date(value).toISOString();
const isoOrNull = (value: Date | string | null): string | null => (value === null ? null : iso(value));

type SummaryRow = {
  id: string;
  song_id: string | null;
  author_id: string | null;
  author_name: string | null;
  title_ar: string | null;
  title_latin: string | null;
  artists: ProposalPayload["artists"];
  status: ProposalStatus;
  review_note: string | null;
  created_at: Date | string;
  reviewed_at: Date | string | null;
  song_published: boolean;
};

const toSummary = (r: SummaryRow): RevisionSummary => ({
  id: r.id,
  songId: r.song_id,
  authorId: r.author_id,
  authorName: r.author_name,
  payload: { titleAr: r.title_ar, titleLatin: r.title_latin, artists: r.artists },
  rightsDeclared: true,
  status: r.status,
  reviewNote: r.review_note,
  createdAt: iso(r.created_at),
  reviewedAt: isoOrNull(r.reviewed_at),
  songPublished: r.song_published,
});

async function summariesWhere(where: SQL, order: SQL): Promise<RevisionSummary[]> {
  const res = await db.execute<SummaryRow>(sql`
    SELECT r.id, r.song_id, r.author_id, u.name AS author_name,
      r.payload->>'titleAr' AS title_ar, r.payload->>'titleLatin' AS title_latin, r.payload->'artists' AS artists,
      r.status, r.review_note, r.created_at, r.reviewed_at,
      COALESCE(s.status = 'published', false) AS song_published
    FROM song_revisions r
    LEFT JOIN users u ON u.id = r.author_id
    LEFT JOIN songs s ON s.id = r.song_id
    WHERE ${where}
    ORDER BY ${order}`);
  return res.rows.map(toSummary);
}

/** Mes contributions : les propositions de l'auteur, de la plus récente à la plus ancienne. */
export const revisionsOf = (authorId: string): Promise<RevisionSummary[]> =>
  summariesWhere(sql`r.author_id = ${authorId}`, sql`r.created_at DESC, r.id`);

/** File de modération : les propositions en attente, de la plus ancienne à la plus récente (spec §8.4). */
export const pendingRevisions = (): Promise<RevisionSummary[]> =>
  summariesWhere(sql`r.status = 'pending'`, sql`r.created_at ASC, r.id`);

/** Une proposition, avec sa version complète. `null` si l'identifiant est invalide ou inconnu. */
export async function getRevision(id: string): Promise<Revision | null> {
  if (!isUuid(id)) return null;
  const res = await db.execute<{
    id: string;
    song_id: string | null;
    author_id: string | null;
    author_name: string | null;
    payload: ProposalPayload;
    status: ProposalStatus;
    review_note: string | null;
    created_at: Date | string;
    reviewed_at: Date | string | null;
  }>(sql`
    SELECT r.id, r.song_id, r.author_id, u.name AS author_name, r.payload, r.status, r.review_note,
      r.created_at, r.reviewed_at
    FROM song_revisions r LEFT JOIN users u ON u.id = r.author_id
    WHERE r.id = ${id}`);
  const r = res.rows[0];
  if (!r) return null;
  return {
    id: r.id,
    songId: r.song_id,
    authorId: r.author_id,
    authorName: r.author_name,
    payload: r.payload,
    rightsDeclared: true,
    status: r.status,
    reviewNote: r.review_note,
    createdAt: iso(r.created_at),
    reviewedAt: isoOrNull(r.reviewed_at),
  };
}

/** L'auteur a déjà une correction de cette chanson en attente (spec §8.3 : une seule à la fois). */
export async function hasPendingRevision(authorId: string, songId: string): Promise<boolean> {
  const res = await db.execute(sql`
    SELECT 1 FROM song_revisions WHERE author_id = ${authorId} AND song_id = ${songId} AND status = 'pending'`);
  return res.rows.length > 0;
}

/** Propositions en attente de l'auteur : la pastille de Mes contributions sur la page Moi. */
export async function pendingRevisionCountOf(authorId: string): Promise<number> {
  const res = await db.execute<{ n: string }>(sql`
    SELECT count(*) AS n FROM song_revisions WHERE author_id = ${authorId} AND status = 'pending'`);
  return Number(res.rows[0].n);
}

/** Taille des deux files : sous-onglets de la modération et pastille « N à relire » de la page Moi. */
export async function moderationCounts(): Promise<{ proposals: number; reports: number }> {
  const res = await db.execute<{ proposals: string; reports: string }>(sql`
    SELECT (SELECT count(*) FROM song_revisions WHERE status = 'pending') AS proposals,
      (SELECT count(*) FROM reports WHERE status = 'open') AS reports`);
  return { proposals: Number(res.rows[0].proposals), reports: Number(res.rows[0].reports) };
}
