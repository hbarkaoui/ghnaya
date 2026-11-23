// Plan 3, tâche 3 : approbation d'une proposition, en une transaction (spec §8.5 ; §13, cycle de vie d'une révision).
import { eq, sql } from "drizzle-orm";
import type { PoolClient } from "pg";
import { beforeEach, describe, expect, it } from "vitest";
import { artistIdentityKey } from "@/lib/catalog/artists";
import { getSongById } from "@/lib/catalog/queries";
import { db, pool } from "@/lib/db/client";
import { songRevisions, songs } from "@/lib/db/schema";
import { getRevision } from "@/lib/moderation/queries";
import { approveRevision } from "@/lib/moderation/revisionWrite";
import { searchSongs } from "@/lib/search/searchSongs";
import type { Song } from "@/types/catalog";
import type { ProposalPayload } from "@/types/proposal";
import { seedFixtures } from "../fixtures/seed";
import { insertRevision, insertUser, PAYLOAD } from "./factories";
import { resetDb } from "./helpers";

const UNKNOWN = "6f1c2a7e-8a7b-4c1d-9e2f-0a1b2c3d4e5f";

/** La chanson telle quelle, comme le formulaire de correction la pré-remplit. */
const payloadOf = (song: Song): ProposalPayload => ({
  titleAr: song.titleAr,
  titleLatin: song.titleLatin,
  artists: song.artists.map(({ id, nameAr, nameLatin }) => ({ id, nameAr, nameLatin })),
  lyrics: song.lyrics,
  lyricsTranslit: song.lyricsTranslit,
  dialect: song.dialect,
});

const count = async (query: string) => Number((await db.execute<{ n: string }>(sql.raw(query))).rows[0].n);
const artistCount = () => count("SELECT count(*) AS n FROM artists");

describe("approuver une proposition", () => {
  let ids = new Map<string, string>();
  let leila: { id: string };
  let rania: { id: string };

  beforeEach(async () => {
    await resetDb();
    ids = await seedFixtures(db);
    leila = await insertUser({ name: "Leïla" });
    rania = await insertUser({ name: "Rania", globalRole: "moderator" });
  });

  const fixture = async (ref: string): Promise<Song> => {
    const song = await getSongById(ids.get(ref)!);
    if (!song) throw new Error(`chanson de test introuvable : ${ref}`);
    return song;
  };

  it("un ajout crée la chanson, publiée et cherchable, avec un artiste nouveau et un artiste connu", async () => {
    const saber = (await fixture("s-sidi-mansour")).artists[0];
    const payload: ProposalPayload = {
      titleAr: "لمّا بدا يتثنّى",
      titleLatin: "Lamma Bada Yatathanna",
      artists: [
        { id: null, nameAr: "تراث أندلسي", nameLatin: "Répertoire andalou" },
        { id: saber.id, nameAr: saber.nameAr, nameLatin: saber.nameLatin },
      ],
      lyrics: "يا نسيم الليل سلّم\nعلى الحبايب في الدار",
      lyricsTranslit: "ya nassim el lil sallem\n3la el 7bayeb fi ed-dar",
      dialect: "maghreb_other",
    };
    const revision = await insertRevision({ authorId: leila.id, payload });
    const artistsBefore = await artistCount();

    const result = await approveRevision(db, { revisionId: revision, reviewerId: rania.id, note: null });
    if (!result.ok) throw new Error(result.error);

    expect(await artistCount()).toBe(artistsBefore + 1);
    expect(await getSongById(result.songId)).toMatchObject({
      titleLatin: "Lamma Bada Yatathanna",
      source: "contribution",
      dialect: "maghreb_other",
      lyricsTranslit: payload.lyricsTranslit,
      translitStatus: "reviewed",
      artists: [
        { nameLatin: "Répertoire andalou", role: "main" },
        { id: saber.id, nameLatin: "Saber Rebai", role: "main" },
      ],
    });
    const [row] = await db.select().from(songs).where(eq(songs.id, result.songId));
    expect(row).toMatchObject({ status: "published", sourceRef: null, importLocked: false });
    expect((await searchSongs("lamma bada")).items[0]?.id).toBe(result.songId);
    expect((await searchSongs("répertoire andalou")).items.map((i) => i.id)).toContain(result.songId);

    expect(await getRevision(revision)).toMatchObject({ status: "approved", songId: null });
    const [reviewed] = await db.select().from(songRevisions).where(eq(songRevisions.id, revision));
    expect(reviewed.reviewerId).toBe(rania.id);
    expect(reviewed.reviewedAt).not.toBeNull();
  });

  it("une correction garde l'identifiant, la source et le rôle des artistes, et protège la chanson des imports", async () => {
    const sidi = await fixture("s-sidi-mansour");
    const payload = { ...payloadOf(sidi), titleLatin: "Sidi Mansour (version longue)", lyrics: `${sidi.lyrics}\nوالدار ضاوية بينا` };
    const revision = await insertRevision({ authorId: leila.id, songId: sidi.id, payload });

    expect(await approveRevision(db, { revisionId: revision, reviewerId: rania.id, note: "Merci !" })).toEqual({
      ok: true,
      songId: sidi.id,
    });
    const after = await getSongById(sidi.id);
    expect(after).toMatchObject({ titleLatin: "Sidi Mansour (version longue)", source: sidi.source, artists: sidi.artists });
    expect(after?.lyrics.endsWith("والدار ضاوية بينا")).toBe(true);
    const [row] = await db.select().from(songs).where(eq(songs.id, sidi.id));
    expect(row.importLocked).toBe(true);
    expect((await searchSongs("version longue")).items[0]?.id).toBe(sidi.id);
    expect(await getRevision(revision)).toMatchObject({ status: "approved", reviewNote: "Merci !" });

    // Un nouvel import ne défait pas la correction (écart 6 ; plan 1 : une chanson verrouillée n'est pas réécrite).
    await seedFixtures(db);
    expect((await getSongById(sidi.id))?.titleLatin).toBe("Sidi Mansour (version longue)");
  });

  it("des paroles corrigées sans nouvelle translittération vident la translittération (spec §8.5)", async () => {
    const id = ids.get("s-ya-lili")!;
    await db.update(songs).set({ lyricsTranslit: "ya lili\nya lili", translitStatus: "auto" }).where(eq(songs.id, id));
    const yaLili = await fixture("s-ya-lili");
    const revision = await insertRevision({
      authorId: leila.id,
      songId: id,
      payload: { ...payloadOf(yaLili), lyrics: `${yaLili.lyrics}\nيا ليلي يا ليلي` },
    });
    await approveRevision(db, { revisionId: revision, reviewerId: rania.id, note: null });
    expect(await getSongById(id)).toMatchObject({ lyricsTranslit: null, translitStatus: "none" });
  });

  it("refuse la correction d'une chanson retirée entre-temps, sans rien écrire", async () => {
    const habaytak = await fixture("s-habaytak");
    const revision = await insertRevision({
      authorId: leila.id,
      songId: habaytak.id,
      payload: { ...payloadOf(habaytak), artists: [{ id: null, nameAr: null, nameLatin: "Artiste Nouveau" }] },
    });
    await db.update(songs).set({ status: "removed" }).where(eq(songs.id, habaytak.id));
    const artistsBefore = await artistCount();

    expect(await approveRevision(db, { revisionId: revision, reviewerId: rania.id, note: null })).toEqual({
      ok: false,
      error: "songGone",
    });
    expect(await artistCount()).toBe(artistsBefore);
    expect((await getRevision(revision))?.status).toBe("pending");
  });

  it("refuse une proposition déjà relue ou inconnue", async () => {
    const revision = await insertRevision({ authorId: leila.id });
    expect((await approveRevision(db, { revisionId: revision, reviewerId: rania.id, note: null })).ok).toBe(true);
    expect(await approveRevision(db, { revisionId: revision, reviewerId: rania.id, note: null })).toEqual({
      ok: false,
      error: "notPending",
    });
    expect(await approveRevision(db, { revisionId: UNKNOWN, reviewerId: rania.id, note: null })).toEqual({
      ok: false,
      error: "notFound",
    });
  });

  it("deux modérateurs qui approuvent en même temps : une seule chanson créée", async () => {
    const revision = await insertRevision({ authorId: leila.id });
    const other = await insertUser({ globalRole: "moderator" });
    const results = await Promise.all([
      approveRevision(db, { revisionId: revision, reviewerId: rania.id, note: null }),
      approveRevision(db, { revisionId: revision, reviewerId: other.id, note: null }),
    ]);
    expect(results.filter((r) => r.ok)).toHaveLength(1);
    expect(results.filter((r) => !r.ok)).toEqual([{ ok: false, error: "notPending" }]);
    expect(await count("SELECT count(*) AS n FROM songs WHERE source = 'contribution'")).toBe(1);
  });

  it("crée les nouveaux artistes dans l'ordre de leur clé d'identité : pas d'interblocage avec une autre approbation", async () => {
    // L'autre approbation crée les mêmes artistes, dans l'ordre des clés : « amel ayari », puis « zina zarrouk ».
    const payload: ProposalPayload = {
      ...PAYLOAD,
      artists: [
        { id: null, nameAr: null, nameLatin: "Zina Zarrouk" },
        { id: null, nameAr: null, nameLatin: "Amel Ayari" },
      ],
    };
    const revision = await insertRevision({ authorId: leila.id, payload });
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      await insertArtist(client, "Amel Ayari");

      const approval = approveRevision(db, { revisionId: revision, reviewerId: rania.id, note: null }).then(
        (value) => ({ value }),
        (error: unknown) => ({ error }),
      );
      // L'approbation attend l'autre transaction (sur « amel ayari », ou sur le premier verrou qu'elle prend).
      for (let i = 0; i < 100 && !(await waitingOnLock()); i += 1) await new Promise((r) => setTimeout(r, 20));
      expect(await waitingOnLock()).toBe(true);

      // Dans l'ordre de la proposition, l'approbation tiendrait « zina zarrouk » : interblocage.
      await insertArtist(client, "Zina Zarrouk");
      await client.query("COMMIT");
      expect(await approval).toEqual({ value: { ok: true, songId: expect.any(String) } });
    } finally {
      await client.query("ROLLBACK").catch(() => undefined);
      client.release();
    }
    expect(await count("SELECT count(*) AS n FROM artists WHERE identity_key IN ('amel ayari', 'zina zarrouk')")).toBe(2);
  });
});

/** Une requête de la base de test attend un verrou. */
async function waitingOnLock(): Promise<boolean> {
  const res = await db.execute<{ n: string }>(sql`
    SELECT count(*) AS n FROM pg_stat_activity WHERE datname = current_database() AND wait_event_type = 'Lock'`);
  return Number(res.rows[0].n) > 0;
}

/** L'artiste, créé comme le ferait `upsertArtist` dans une autre transaction. */
async function insertArtist(client: PoolClient, nameLatin: string): Promise<void> {
  await client.query(
    "INSERT INTO artists (name_latin, identity_key) VALUES ($1, $2) ON CONFLICT (identity_key) DO NOTHING",
    [nameLatin, artistIdentityKey({ nameLatin })],
  );
}
