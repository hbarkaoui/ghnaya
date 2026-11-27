import "server-only";
import { and, eq, isNotNull, isNull, lt, lte, ne } from "drizzle-orm";
import { deleteUserAccount } from "@/lib/account/write";
import type { Db } from "@/lib/db/client";
import { reports, sessions, users, verifications } from "@/lib/db/schema";
import { inactivityEmail } from "@/lib/mail/inactivityEmail";
import { type MailMessage, sendMail } from "@/lib/mail/transport";

/**
 * Durées de conservation annoncées dans la politique de confidentialité (« Combien de temps »), appliquées
 * chaque nuit par `GET /api/taches/conservation` (tâche planifiée de Vercel). Toute durée changée ici doit
 * l'être aussi dans `src/app/a-propos/confidentialite/fr.tsx` et `ar.tsx`.
 */
export const RETENTION_DAYS = {
  /** Adresse de contact d'un signalement, après sa clôture. */
  reportContact: 365,
  /** Compte sans connexion ni session prolongée. */
  inactiveAccount: 3 * 365,
  /** Délai minimal entre l'e-mail d'avertissement et la suppression. */
  inactivityNotice: 30,
} as const;

const DAY_MS = 86_400_000;
const before = (now: Date, days: number) => new Date(now.getTime() - days * DAY_MS);

export interface RetentionResult {
  expiredSessions: number;
  expiredVerifications: number;
  reportContacts: number;
  deletedAccounts: number;
  /** Comptes inactifs gardés : seuls animateurs d'un club, qu'il faudrait confier à quelqu'un. */
  keptLastAnimators: number;
  inactivityNotices: number;
  /** Avertissements qui n'ont pas pu partir : réessayés la nuit suivante. */
  failedNotices: number;
}

export interface RetentionOptions {
  now?: Date;
  send?: (message: MailMessage) => Promise<void>;
  /** Adresse publique du site, pour le lien de connexion de l'avertissement. */
  siteUrl?: string;
}

/** Le compte a servi : il repart pour 3 ans, et un avertissement déjà envoyé ne compte plus. */
export async function markUserActive(db: Db, userId: string, now: Date = new Date()): Promise<void> {
  await db.update(users).set({ lastActiveAt: now, inactivityNoticeAt: null }).where(eq(users.id, userId));
}

export async function runRetention(db: Db, options: RetentionOptions = {}): Promise<RetentionResult> {
  const now = options.now ?? new Date();
  const send = options.send ?? sendMail;
  const signInUrl = `${(options.siteUrl ?? process.env.BETTER_AUTH_URL ?? "").replace(/\/+$/, "")}/connexion`;

  const expiredSessions = await db
    .delete(sessions)
    .where(lt(sessions.expiresAt, now))
    .returning({ id: sessions.id });
  const expiredVerifications = await db
    .delete(verifications)
    .where(lt(verifications.expiresAt, now))
    .returning({ id: verifications.id });

  // `updated_at` d'un signalement clos est la date de sa clôture (lib/moderation/reportWrite) ; on ne le
  // touche pas ici, pour ne pas la perdre.
  const reportContacts = await db
    .update(reports)
    .set({ contactEmail: null })
    .where(
      and(
        ne(reports.status, "open"),
        isNotNull(reports.contactEmail),
        lt(reports.updatedAt, before(now, RETENTION_DAYS.reportContact)),
      ),
    )
    .returning({ id: reports.id });

  // Suppression d'abord : un compte averti cette nuit ne peut pas être supprimé dans la même passe.
  const toDelete = await db
    .select({ id: users.id })
    .from(users)
    .where(
      and(
        lt(users.lastActiveAt, before(now, RETENTION_DAYS.inactiveAccount)),
        lte(users.inactivityNoticeAt, before(now, RETENTION_DAYS.inactivityNotice)),
      ),
    );
  let deletedAccounts = 0;
  let keptLastAnimators = 0;
  for (const { id } of toDelete) {
    const result = await deleteUserAccount(db, id);
    if (result.ok) deletedAccounts += 1;
    else keptLastAnimators += 1;
  }

  const toWarn = await db
    .select({ id: users.id, email: users.email, locale: users.locale, lastActiveAt: users.lastActiveAt })
    .from(users)
    .where(
      and(
        lt(users.lastActiveAt, before(now, RETENTION_DAYS.inactiveAccount - RETENTION_DAYS.inactivityNotice)),
        isNull(users.inactivityNoticeAt),
      ),
    );
  let inactivityNotices = 0;
  let failedNotices = 0;
  for (const user of toWarn) {
    // Supprimé au plus tôt 3 ans après la dernière activité, et jamais moins d'un mois après cet e-mail.
    const deleteOn = new Date(
      Math.max(
        user.lastActiveAt.getTime() + RETENTION_DAYS.inactiveAccount * DAY_MS,
        now.getTime() + RETENTION_DAYS.inactivityNotice * DAY_MS,
      ),
    );
    try {
      await send({ to: user.email, ...inactivityEmail({ url: signInUrl, deleteOn, locale: user.locale }), link: signInUrl });
      await db.update(users).set({ inactivityNoticeAt: now }).where(eq(users.id, user.id));
      inactivityNotices += 1;
    } catch {
      failedNotices += 1;
    }
  }

  return {
    expiredSessions: expiredSessions.length,
    expiredVerifications: expiredVerifications.length,
    reportContacts: reportContacts.length,
    deletedAccounts,
    keptLastAnimators,
    inactivityNotices,
    failedNotices,
  };
}
