import { eq, sql } from "drizzle-orm";
import { beforeEach, describe, expect, it } from "vitest";
import { upsertArtist } from "@/lib/catalog/artists";
import { upsertSong, type ImportSongInput } from "@/lib/catalog/songs";
import { db } from "@/lib/db/client";
import { songArtists, songs } from "@/lib/db/schema";
import { resetDb } from "./helpers";

async function sampleInput(overrides: Partial<ImportSongInput> = {}): Promise<ImportSongInput> {
  const saber = await upsertArtist(db, { nameAr: "صابر الرباعي", nameLatin: "Saber Rebai" });
  return {
    titleAr: "سيدي منصور",
    titleLatin: "Sidi Mansour",
    lyrics: "سطر تجريبي\nسطر ثاني",
    dialect: "tn",
    source: "lrclib",
    sourceRef: "100",
    artists: [{ ...saber, role: "main" }],
    ...overrides,
  };
}

describe("upsertArtist", () => {
  beforeEach(resetDb);

  it("fusionne sur identity_key : garde les noms existants, unit les alias", async () => {
    const a = await upsertArtist(db, { nameLatin: "Saber Rebai", aliases: ["Saber Rebaï"] });
    const b = await upsertArtist(db, { nameLatin: "saber rebai", nameAr: "صابر الرباعي", aliases: ["Saber Al Robaii"] });
    expect(b.id).toBe(a.id);
    expect(b.names.nameLatin).toBe("Saber Rebai");
    expect(b.names.nameAr).toBe("صابر الرباعي");
    expect([...(b.names.aliases ?? [])].sort()).toEqual(["Saber Al Robaii", "Saber Rebaï"]);
    const row = await db.execute<{ search_key: string }>(sql`SELECT search_key FROM artists WHERE id = ${a.id}`);
    expect(row.rows[0].search_key).toContain("sbrb");
  });
});

describe("upsertSong", () => {
  beforeEach(resetDb);

  it("insère puis met à jour la même chanson (idempotent)", async () => {
    const input = await sampleInput();
    const first = await upsertSong(db, input);
    expect(first.outcome).toBe("inserted");
    const second = await upsertSong(db, { ...input, sourceRef: "200", lyrics: "سطر جديد" });
    expect(second).toEqual({ id: first.id, outcome: "updated" });
    const [row] = await db.select().from(songs).where(eq(songs.id, first.id));
    expect(row.sourceRef).toBe("200");
    expect(row.searchKey).toBe("sdmnsr sbrlrb sbrb");
    const links = await db.select().from(songArtists).where(eq(songArtists.songId, first.id));
    expect(links).toHaveLength(1);
  });

  it("ne touche jamais une chanson verrouillée ni son statut", async () => {
    const input = await sampleInput();
    const { id } = await upsertSong(db, input);
    await db.update(songs).set({ importLocked: true, status: "removed" }).where(eq(songs.id, id));
    const again = await upsertSong(db, { ...input, lyrics: "تغيير" });
    expect(again).toEqual({ id, outcome: "locked" });
    const [row] = await db.select().from(songs).where(eq(songs.id, id));
    expect(row.lyrics).toBe(input.lyrics);
    expect(row.status).toBe("removed");
  });

  it("ne ressuscite pas une chanson retirée non verrouillée", async () => {
    const input = await sampleInput();
    const { id } = await upsertSong(db, input);
    await db.update(songs).set({ status: "removed" }).where(eq(songs.id, id));
    await upsertSong(db, input);
    const [row] = await db.select().from(songs).where(eq(songs.id, id));
    expect(row.status).toBe("removed");
  });

  it("garde la translittération si les paroles sont inchangées, la remet à zéro sinon", async () => {
    const input = await sampleInput();
    const { id } = await upsertSong(db, input);
    await db.update(songs).set({ lyricsTranslit: "str\nstr", translitStatus: "auto" }).where(eq(songs.id, id));
    await upsertSong(db, input);
    let [row] = await db.select().from(songs).where(eq(songs.id, id));
    expect(row.translitStatus).toBe("auto");
    await upsertSong(db, { ...input, lyrics: "سطر مختلف\nسطر" });
    [row] = await db.select().from(songs).where(eq(songs.id, id));
    expect(row.translitStatus).toBe("none");
    expect(row.lyricsTranslit).toBeNull();
  });

  it("dédoublonne arabe et arabizi : même clé de titre", async () => {
    const input = await sampleInput();
    const a = await upsertSong(db, { ...input, titleLatin: undefined });
    const b = await upsertSong(db, { ...input, titleAr: undefined, sourceRef: "300" });
    expect(b.id).toBe(a.id);
  });
});
