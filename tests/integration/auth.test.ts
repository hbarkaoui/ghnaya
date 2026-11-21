import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { eq } from "drizzle-orm";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { getAuth } from "@/lib/auth/auth";
import { db } from "@/lib/db/client";
import { sessions, users } from "@/lib/db/schema";
import { readOutbox } from "@/lib/mail/transport";
import { resetDb } from "./helpers";

let dir: string;

beforeAll(async () => {
  dir = await mkdtemp(join(tmpdir(), "ghnaya-auth-"));
  process.env.MAIL_TRANSPORT = "outbox";
  process.env.OUTBOX_DIR = dir;
});
afterAll(async () => {
  await rm(dir, { recursive: true, force: true });
});

/** Demande un lien, le lit dans la boîte locale, puis l'ouvre (sans callbackURL : réponse JSON). */
async function signInByMagicLink(email: string, locale: "fr" | "ar" = "fr") {
  await getAuth().api.signInMagicLink({ body: { email, metadata: { locale } }, headers: new Headers() });
  const entry = await readOutbox(email);
  const token = new URL(entry!.link!).searchParams.get("token")!;
  await getAuth().api.magicLinkVerify({ query: { token }, headers: new Headers() });
  return entry!;
}

describe("connexion par lien magique", () => {
  beforeEach(resetDb);

  it("crée le compte à la première connexion, adresse vérifiée, nom tiré de l'adresse", async () => {
    await signInByMagicLink("leila@example.com");
    const [user] = await db.select().from(users).where(eq(users.email, "leila@example.com"));
    expect(user).toMatchObject({ name: "leila", emailVerified: true, globalRole: "member", isAnimator: false });
    expect(user.id).toMatch(/^[0-9a-f-]{36}$/);
    expect(await db.select().from(sessions).where(eq(sessions.userId, user.id))).toHaveLength(1);
  });

  it("retrouve le même compte à la connexion suivante", async () => {
    await signInByMagicLink("sami@example.com");
    await signInByMagicLink("sami@example.com");
    expect(await db.select().from(users).where(eq(users.email, "sami@example.com"))).toHaveLength(1);
  });

  it("écrit l'e-mail dans la langue demandée", async () => {
    const entry = await signInByMagicLink("nour@example.com", "ar");
    expect(entry.html).toContain('dir="rtl"');
  });

  it("un lien ne sert qu'une fois", async () => {
    await getAuth().api.signInMagicLink({ body: { email: "rania@example.com" }, headers: new Headers() });
    const token = new URL((await readOutbox("rania@example.com"))!.link!).searchParams.get("token")!;
    await getAuth().api.magicLinkVerify({ query: { token }, headers: new Headers() });
    await expect(getAuth().api.magicLinkVerify({ query: { token }, headers: new Headers() })).rejects.toThrow();
  });
});
