import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { eq } from "drizzle-orm";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { getAuth } from "@/lib/auth/auth";
import { db } from "@/lib/db/client";
import { accounts, sessions, users, verifications } from "@/lib/db/schema";
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

  it("un nom trop long à l'inscription est remplacé par celui tiré de l'adresse", async () => {
    const email = "long@example.com";
    await getAuth().api.signInMagicLink({ body: { email, name: "x".repeat(200) }, headers: new Headers() });
    const token = new URL((await readOutbox(email))!.link!).searchParams.get("token")!;
    await getAuth().api.magicLinkVerify({ query: { token }, headers: new Headers() });
    const [user] = await db.select().from(users).where(eq(users.email, email));
    expect(user.name).toBe("long");
  });

  it("un nom valide à l'inscription est gardé, espaces nettoyés", async () => {
    const email = "salma@example.com";
    await getAuth().api.signInMagicLink({ body: { email, name: "  Salma   Ben Ali " }, headers: new Headers() });
    const token = new URL((await readOutbox(email))!.link!).searchParams.get("token")!;
    await getAuth().api.magicLinkVerify({ query: { token }, headers: new Headers() });
    const [user] = await db.select().from(users).where(eq(users.email, email));
    expect(user.name).toBe("Salma Ben Ali");
  });

  it("une mise à jour du nom est validée et normalisée", async () => {
    await signInByMagicLink("yasmine@example.com");
    const [user] = await db.select().from(users).where(eq(users.email, "yasmine@example.com"));
    const { internalAdapter } = await getAuth().$context;
    await expect(internalAdapter.updateUser(user.id, { name: "x".repeat(61) })).rejects.toThrow();
    await expect(internalAdapter.updateUser(user.id, { name: "   " })).rejects.toThrow();
    await internalAdapter.updateUser(user.id, { name: " Yasmine   Trabelsi " });
    const [after] = await db.select().from(users).where(eq(users.id, user.id));
    expect(after.name).toBe("Yasmine Trabelsi");
  });

  it("garde le jeton du lien haché en base", async () => {
    await getAuth().api.signInMagicLink({ body: { email: "hana@example.com" }, headers: new Headers() });
    const token = new URL((await readOutbox("hana@example.com"))!.link!).searchParams.get("token")!;
    const rows = await db.select().from(verifications);
    expect(rows).toHaveLength(1);
    expect(rows[0].identifier).not.toBe(token);
    expect(JSON.stringify(rows[0])).not.toContain(token);
  });
});

describe("comptes Google", () => {
  beforeEach(resetDb);

  // Les jetons Google ne servent qu'à la connexion : ni gardés à la création, ni à la reconnexion.
  it("ne conserve aucun jeton Google, à la création comme à la mise à jour", async () => {
    const [user] = await db
      .insert(users)
      .values({ email: "nadia@example.com", name: "nadia", emailVerified: true })
      .returning();
    const adapter = (await getAuth().$context).internalAdapter;
    const tokens = {
      accessToken: "ya29.acces",
      refreshToken: "1//actualisation",
      idToken: "eyJ.identite",
      accessTokenExpiresAt: new Date(Date.now() + 3600_000),
      refreshTokenExpiresAt: new Date(Date.now() + 86_400_000),
      scope: "openid,email,profile",
    };
    const account = await adapter.createAccount({ userId: user.id, providerId: "google", accountId: "g-123", ...tokens });
    const empty = {
      accessToken: null,
      refreshToken: null,
      idToken: null,
      accessTokenExpiresAt: null,
      refreshTokenExpiresAt: null,
    };
    const [created] = await db.select().from(accounts).where(eq(accounts.id, account.id));
    expect(created).toMatchObject({ providerId: "google", accountId: "g-123", ...empty });

    await adapter.updateAccount(account.id, tokens);
    const [updated] = await db.select().from(accounts).where(eq(accounts.id, account.id));
    expect(updated).toMatchObject(empty);
  });
});
