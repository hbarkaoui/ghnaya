import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { mailTransport, readOutbox, sendMail } from "@/lib/mail/transport";

describe("mailTransport", () => {
  it("écrit dans la boîte locale hors production, sauf demande contraire", () => {
    expect(mailTransport({ NODE_ENV: "development" })).toBe("outbox");
    expect(mailTransport({ NODE_ENV: "test" })).toBe("outbox");
    expect(mailTransport({ NODE_ENV: "development", MAIL_TRANSPORT: "smtp" })).toBe("smtp");
  });

  it("envoie par SMTP en production, sauf si la boîte locale est demandée (tests de bout en bout)", () => {
    expect(mailTransport({ NODE_ENV: "production" })).toBe("smtp");
    expect(mailTransport({ NODE_ENV: "production", MAIL_TRANSPORT: "outbox" })).toBe("outbox");
  });
});

describe("boîte locale", () => {
  let dir: string;
  beforeEach(async () => {
    dir = await mkdtemp(join(tmpdir(), "ghnaya-outbox-"));
    process.env.MAIL_TRANSPORT = "outbox";
    process.env.OUTBOX_DIR = dir;
  });
  afterEach(async () => {
    delete process.env.MAIL_TRANSPORT;
    delete process.env.OUTBOX_DIR;
    await rm(dir, { recursive: true, force: true });
  });

  it("garde le dernier message de chaque adresse, lien compris", async () => {
    await sendMail({ to: "Leila@Example.com", subject: "1", text: "t", html: "h", link: "http://x/1" });
    await sendMail({ to: "leila@example.com", subject: "2", text: "t", html: "h", link: "http://x/2" });
    const entry = await readOutbox("LEILA@example.com");
    expect(entry).toMatchObject({ subject: "2", link: "http://x/2" });
    expect(entry?.sentAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });

  it("renvoie null pour une adresse sans message", async () => {
    expect(await readOutbox("personne@example.com")).toBeNull();
  });
});
