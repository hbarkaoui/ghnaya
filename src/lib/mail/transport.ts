import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import nodemailer, { type Transporter } from "nodemailer";

/**
 * Envoi des e-mails (plan 2, tâche 2). En production : SMTP (`SMTP_URL`, `MAIL_FROM`), quel que soit le
 * fournisseur. Ailleurs, ou si `MAIL_TRANSPORT=outbox` : rien ne part, le dernier message de chaque adresse
 * est écrit dans `.outbox/` (ou `OUTBOX_DIR`). L'aperçu « Ouvrir le lien reçu » de la connexion et les tests
 * de bout en bout y lisent le lien. Ne jamais régler `outbox` sur le serveur de production.
 */
export interface MailMessage {
  to: string;
  subject: string;
  text: string;
  html: string;
  /** Adresse que le message invite à ouvrir (lien magique) : gardée par la boîte locale. */
  link?: string;
}

export interface OutboxEntry extends MailMessage {
  sentAt: string;
}

export function mailTransport(env: NodeJS.ProcessEnv = process.env): "smtp" | "outbox" {
  if (env.MAIL_TRANSPORT === "smtp" || env.MAIL_TRANSPORT === "outbox") return env.MAIL_TRANSPORT;
  return env.NODE_ENV === "production" ? "smtp" : "outbox";
}

const outboxDir = () => process.env.OUTBOX_DIR ?? join(process.cwd(), ".outbox");
const outboxFile = (email: string) => join(outboxDir(), `${encodeURIComponent(email.trim().toLowerCase())}.json`);

let smtp: Transporter | undefined;

export async function sendMail(message: MailMessage): Promise<void> {
  if (mailTransport() === "outbox") {
    await mkdir(outboxDir(), { recursive: true });
    const entry: OutboxEntry = { ...message, sentAt: new Date().toISOString() };
    await writeFile(outboxFile(message.to), JSON.stringify(entry, null, 2));
    return;
  }
  const url = process.env.SMTP_URL;
  const from = process.env.MAIL_FROM;
  if (!url || !from) throw new Error("SMTP_URL et MAIL_FROM sont nécessaires pour envoyer un e-mail.");
  smtp ??= nodemailer.createTransport(url);
  await smtp.sendMail({ from, to: message.to, subject: message.subject, text: message.text, html: message.html });
}

/** Dernier message envoyé à `email` dans la boîte locale, ou `null`. */
export async function readOutbox(email: string): Promise<OutboxEntry | null> {
  try {
    return JSON.parse(await readFile(outboxFile(email), "utf8")) as OutboxEntry;
  } catch {
    return null;
  }
}
