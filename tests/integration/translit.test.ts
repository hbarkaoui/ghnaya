// Plan 4, tâche 4 : génération à la demande sous verrou, attente, plafond et échecs (spec §7).
import { eq, sql } from "drizzle-orm";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { toCurrentUser, type CurrentUser } from "@/lib/auth/types";
import { db } from "@/lib/db/client";
import { songs, users } from "@/lib/db/schema";
import { fakeTranslit } from "@/lib/translit/fake";
import type { TranslitGenerator } from "@/lib/translit/generator";
import { TRANSLIT_LIMIT_KEY, requestSongTranslit, type TranslitServiceOptions } from "@/lib/translit/service";
import { insertSong, insertUser } from "./factories";
import { resetDb } from "./helpers";

/** `insertSong` écrit des paroles de deux lignes : « سطر\nسطر ». */
const EXPECTED = fakeTranslit("سطر\nسطر");

const echo = () => vi.fn<TranslitGenerator>(async ({ lyrics }) => fakeTranslit(lyrics));
const options = (generator: TranslitGenerator | null, over: Partial<TranslitServiceOptions> = {}): TranslitServiceOptions => ({
  generator,
  dailyLimit: 300,
  waitMs: 2_000,
  pollMs: 10,
  ...over,
});

async function member(over: Partial<typeof users.$inferInsert> = {}): Promise<CurrentUser> {
  const { id } = await insertUser(over);
  const [row] = await db.select().from(users).where(eq(users.id, id));
  return toCurrentUser(row, []);
}

async function song(id: string) {
  const [row] = await db.select().from(songs).where(eq(songs.id, id));
  return row;
}

async function limitCount(): Promise<number> {
  const res = await db.execute<{ total: number }>(
    sql`SELECT coalesce(sum(count), 0)::int AS total FROM rate_limits WHERE key = ${TRANSLIT_LIMIT_KEY}`,
  );
  return Number(res.rows[0].total);
}

/** Promesse que le test résout quand il veut : la génération reste « en cours » jusque-là. */
function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((r) => (resolve = r));
  return { promise, resolve };
}

beforeEach(resetDb);

describe("requestSongTranslit", () => {
  it("un membre déclenche la génération : texte enregistré en « auto », verrou levé, plafond compté", async () => {
    const id = await insertSong("Ya Lil");
    const generator = echo();
    await expect(requestSongTranslit(id, await member(), options(generator))).resolves.toEqual({
      ok: true,
      text: EXPECTED,
      status: "auto",
    });
    expect(await song(id)).toMatchObject({ lyricsTranslit: EXPECTED, translitStatus: "auto", translitStartedAt: null });
    expect(generator).toHaveBeenCalledWith({ lyrics: "سطر\nسطر", dialect: "other" }, expect.any(AbortSignal));
    expect(await limitCount()).toBe(1);
  });

  it("une translittération existante est servie à tous, visiteur compris, sans génération ni plafond", async () => {
    const id = await insertSong("Ya Lil");
    await db.update(songs).set({ lyricsTranslit: "str\nstr", translitStatus: "reviewed" }).where(eq(songs.id, id));
    const generator = echo();
    await expect(requestSongTranslit(id, null, options(generator))).resolves.toEqual({
      ok: true,
      text: "str\nstr",
      status: "reviewed",
    });
    expect(generator).not.toHaveBeenCalled();
    expect(await limitCount()).toBe(0);
  });

  it("un visiteur ou un compte non vérifié ne déclenche rien (écart 1)", async () => {
    const id = await insertSong("Ya Lil");
    const generator = echo();
    await expect(requestSongTranslit(id, null, options(generator))).resolves.toEqual({ ok: false, reason: "signin" });
    const unverified = await member({ emailVerified: false });
    await expect(requestSongTranslit(id, unverified, options(generator))).resolves.toEqual({ ok: false, reason: "signin" });
    expect(generator).not.toHaveBeenCalled();
    expect((await song(id)).translitStatus).toBe("none");
  });

  it("deux demandes simultanées ne font qu'une génération ; la seconde attend le résultat (écart 2)", async () => {
    const id = await insertSong("Ya Lil");
    const gate = deferred<void>();
    const generator = vi.fn<TranslitGenerator>(async ({ lyrics }) => {
      await gate.promise;
      return fakeTranslit(lyrics);
    });
    const user = await member();
    const first = requestSongTranslit(id, user, options(generator));
    await vi.waitFor(async () => expect((await song(id)).translitStatus).toBe("generating"));
    const second = requestSongTranslit(id, user, options(generator));
    gate.resolve();
    const expected = { ok: true, text: EXPECTED, status: "auto" };
    await expect(Promise.all([first, second])).resolves.toEqual([expected, expected]);
    expect(generator).toHaveBeenCalledTimes(1);
    expect(await limitCount()).toBe(1);
  });

  it("une attente trop longue répond « failed » sans toucher au verrou d'un autre", async () => {
    const id = await insertSong("Ya Lil");
    await db.update(songs).set({ translitStatus: "generating", translitStartedAt: new Date() }).where(eq(songs.id, id));
    const generator = echo();
    await expect(requestSongTranslit(id, await member(), options(generator, { waitMs: 50 }))).resolves.toEqual({
      ok: false,
      reason: "failed",
    });
    expect(generator).not.toHaveBeenCalled();
    expect((await song(id)).translitStatus).toBe("generating");
  });

  it("un verrou de plus de 2 minutes est repris (écart 3)", async () => {
    const id = await insertSong("Ya Lil");
    await db
      .update(songs)
      .set({ translitStatus: "generating", translitStartedAt: sql`now() - interval '3 minutes'` })
      .where(eq(songs.id, id));
    await expect(requestSongTranslit(id, await member(), options(echo()))).resolves.toMatchObject({ ok: true });
    expect((await song(id)).translitStatus).toBe("auto");
  });

  it("au-delà du plafond quotidien : « limit », et la chanson revient à « none »", async () => {
    const [a, b] = [await insertSong("A"), await insertSong("B")];
    const user = await member();
    await expect(requestSongTranslit(a, user, options(echo(), { dailyLimit: 1 }))).resolves.toMatchObject({ ok: true });
    const generator = echo();
    await expect(requestSongTranslit(b, user, options(generator, { dailyLimit: 1 }))).resolves.toEqual({
      ok: false,
      reason: "limit",
    });
    expect(generator).not.toHaveBeenCalled();
    expect(await song(b)).toMatchObject({ translitStatus: "none", translitStartedAt: null });
  });

  it("un service en échec ou indisponible : « failed », et la chanson revient à « none »", async () => {
    const id = await insertSong("Ya Lil");
    const user = await member();
    const broken = vi.fn<TranslitGenerator>(async () => {
      throw new Error("503");
    });
    await expect(requestSongTranslit(id, user, options(broken))).resolves.toEqual({ ok: false, reason: "failed" });
    expect(await song(id)).toMatchObject({ translitStatus: "none", translitStartedAt: null, lyricsTranslit: null });
    await expect(requestSongTranslit(id, user, options(null))).resolves.toEqual({ ok: false, reason: "failed" });
    expect((await song(id)).translitStatus).toBe("none");
  });

  it("deux alignements mauvais : « failed », sans compter deux fois le plafond", async () => {
    const id = await insertSong("Ya Lil");
    const misaligned = vi.fn<TranslitGenerator>(async () => "une seule ligne");
    await expect(requestSongTranslit(id, await member(), options(misaligned))).resolves.toEqual({
      ok: false,
      reason: "failed",
    });
    expect(misaligned).toHaveBeenCalledTimes(2);
    expect((await song(id)).translitStatus).toBe("none");
    expect(await limitCount()).toBe(1);
  });

  it("une révision approuvée pendant la génération l'emporte : le résultat est jeté (écart 8)", async () => {
    const id = await insertSong("Ya Lil");
    const generator = vi.fn<TranslitGenerator>(async ({ lyrics }) => {
      // Ce que fait l'approbation d'une correction qui apporte sa translittération (plan 3).
      await db
        .update(songs)
        .set({ lyricsTranslit: "relue\nrelue", translitStatus: "reviewed", updatedAt: new Date() })
        .where(eq(songs.id, id));
      return fakeTranslit(lyrics);
    });
    await expect(requestSongTranslit(id, await member(), options(generator))).resolves.toEqual({
      ok: true,
      text: "relue\nrelue",
      status: "reviewed",
    });
    expect(await song(id)).toMatchObject({ lyricsTranslit: "relue\nrelue", translitStatus: "reviewed" });
  });

  it("une chanson retirée ou absente : « failed », sans génération", async () => {
    const id = await insertSong("Ya Lil");
    await db.update(songs).set({ status: "removed", removedReason: "test" }).where(eq(songs.id, id));
    const generator = echo();
    const user = await member();
    await expect(requestSongTranslit(id, user, options(generator))).resolves.toEqual({ ok: false, reason: "failed" });
    await expect(
      requestSongTranslit("00000000-0000-4000-8000-000000000000", user, options(generator)),
    ).resolves.toEqual({ ok: false, reason: "failed" });
    expect(generator).not.toHaveBeenCalled();
  });
});
