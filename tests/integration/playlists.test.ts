import { beforeEach, describe, expect, it } from "vitest";
import { songLabelsOf } from "@/lib/catalog/queries";
import { db } from "@/lib/db/client";
import { songs } from "@/lib/db/schema";
import { toCurrentUser } from "@/lib/auth/types";
import { clubPlaylistsOf, editablePlaylistsOf, getPlaylist, personalPlaylistsOf } from "@/lib/playlist/queries";
import { appendSong, copyPlaylist, createPlaylist, deletePlaylist, editItems, renamePlaylist } from "@/lib/playlist/write";
import { moveItem, removeItem, setItemNote } from "@/lib/playlist/edit";
import { eq } from "drizzle-orm";
import { insertClub, insertSong, insertUser } from "./factories";
import { resetDb } from "./helpers";

describe("playlists en base", () => {
  beforeEach(resetDb);

  it("crée une playlist personnelle avec sa première chanson", async () => {
    const leila = await insertUser({ name: "Leïla" });
    const song = await insertSong("Habaytak");
    const id = await createPlaylist(db, { name: "À apprendre", owner: { userId: leila.id }, createdBy: leila.id, songId: song });
    expect(await getPlaylist(id)).toMatchObject({
      id,
      name: "À apprendre",
      club: null,
      ownerId: leila.id,
      items: [{ position: 1, songId: song, note: null }],
    });
  });

  it("ajoute en fin de liste, sans doublon", async () => {
    const leila = await insertUser();
    const [a, b] = [await insertSong("A"), await insertSong("B")];
    const id = await createPlaylist(db, { name: "P", owner: { userId: leila.id }, createdBy: leila.id });
    expect(await appendSong(db, id, a)).toBe("added");
    expect(await appendSong(db, id, b)).toBe("added");
    expect(await appendSong(db, id, a)).toBe("duplicate");
    expect((await getPlaylist(id))?.items.map((i) => [i.position, i.songId])).toEqual([[1, a], [2, b]]);
  });

  it("donne des positions distinctes à des ajouts simultanés", async () => {
    const leila = await insertUser();
    const ids = await Promise.all(["A", "B", "C", "D", "E"].map(insertSong));
    const id = await createPlaylist(db, { name: "P", owner: { userId: leila.id }, createdBy: leila.id });
    await Promise.all(ids.map((songId) => appendSong(db, id, songId)));
    expect((await getPlaylist(id))?.items.map((i) => i.position)).toEqual([1, 2, 3, 4, 5]);
  });

  it("réordonne, retire et annote en gardant des positions sans trou", async () => {
    const leila = await insertUser();
    const [a, b, c] = [await insertSong("A"), await insertSong("B"), await insertSong("C")];
    const id = await createPlaylist(db, { name: "P", owner: { userId: leila.id }, createdBy: leila.id });
    for (const s of [a, b, c]) await appendSong(db, id, s);

    await editItems(db, id, (items) => moveItem(items, c, "up"));
    await editItems(db, id, (items) => removeItem(items, a));
    await editItems(db, id, (items) => setItemNote(items, b, "  tonalité   Ré "));

    expect((await getPlaylist(id))?.items).toEqual([
      { position: 1, songId: c, note: null },
      { position: 2, songId: b, note: "tonalité Ré" },
    ]);
  });

  it("trie par dernière modification, renomme et supprime", async () => {
    const leila = await insertUser();
    const song = await insertSong("A");
    const first = await createPlaylist(db, { name: "Première", owner: { userId: leila.id }, createdBy: leila.id });
    const second = await createPlaylist(db, { name: "Seconde", owner: { userId: leila.id }, createdBy: leila.id });
    await appendSong(db, first, song); // la première redevient la plus récente
    expect((await personalPlaylistsOf(leila.id)).map((p) => p.name)).toEqual(["Première", "Seconde"]);

    await renamePlaylist(db, second, "Renommée");
    await deletePlaylist(db, first);
    expect((await personalPlaylistsOf(leila.id)).map((p) => p.name)).toEqual(["Renommée"]);
  });

  it("lit les playlists d'un club avec son nom, et seulement celles-là", async () => {
    const sami = await insertUser({ isAnimator: true });
    const club = await insertClub({ name: "Les Jasmins", slug: "les-jasmins", animatorIds: [sami.id] });
    const other = await insertClub({ name: "Autre", slug: "autre", animatorIds: [sami.id] });
    await createPlaylist(db, { name: "Séance du jeudi", owner: { clubId: club.id }, createdBy: sami.id });
    await createPlaylist(db, { name: "Ailleurs", owner: { clubId: other.id }, createdBy: sami.id });
    const list = await clubPlaylistsOf(["les-jasmins"]);
    expect(list).toHaveLength(1);
    expect(list[0]).toMatchObject({ name: "Séance du jeudi", club: { slug: "les-jasmins", name: "Les Jasmins" }, ownerId: null });
    expect(await clubPlaylistsOf([])).toEqual([]);
  });

  it("propose à l'ajout ses playlists et celles des clubs qu'on anime, pas celles des autres clubs", async () => {
    const leila = await insertUser();
    const sami = await insertUser({ isAnimator: true });
    const jasmins = await insertClub({ name: "Les Jasmins", slug: "les-jasmins", animatorIds: [sami.id], memberIds: [leila.id] });
    await createPlaylist(db, { name: "Séance", owner: { clubId: jasmins.id }, createdBy: sami.id });
    await createPlaylist(db, { name: "Mes préférées", owner: { userId: leila.id }, createdBy: leila.id });

    const asLeila = toCurrentUser({ ...leila }, [{ slug: "les-jasmins", name: "Les Jasmins", role: "member" }]);
    const asSami = toCurrentUser({ ...sami, isAnimator: true }, [{ slug: "les-jasmins", name: "Les Jasmins", role: "animator" }]);
    expect((await editablePlaylistsOf(asLeila)).map((p) => p.name)).toEqual(["Mes préférées"]);
    expect((await editablePlaylistsOf(asSami)).map((p) => p.name)).toEqual(["Séance"]);
  });

  it("copie une playlist de club dans les playlists personnelles, avec ses notes", async () => {
    const sami = await insertUser({ isAnimator: true });
    const leila = await insertUser();
    const club = await insertClub({ name: "C", animatorIds: [sami.id], memberIds: [leila.id] });
    const [a, b] = [await insertSong("A"), await insertSong("B")];
    const source = await createPlaylist(db, { name: "Séance", owner: { clubId: club.id }, createdBy: sami.id });
    await appendSong(db, source, a);
    await appendSong(db, source, b);
    await editItems(db, source, (items) => setItemNote(items, b, "Lentement"));

    const copy = await copyPlaylist(db, source, leila.id);
    expect(await getPlaylist(copy!)).toMatchObject({
      name: "Séance",
      club: null,
      ownerId: leila.id,
      items: [
        { position: 1, songId: a, note: null },
        { position: 2, songId: b, note: "Lentement" },
      ],
    });
    expect(await copyPlaylist(db, "00000000-0000-4000-8000-000000000000", leila.id)).toBeNull();
  });

  it("renvoie null pour un identifiant inconnu ou qui n'est pas un UUID", async () => {
    expect(await getPlaylist("seance-du-jeudi")).toBeNull();
    expect(await getPlaylist("00000000-0000-4000-8000-000000000000")).toBeNull();
  });

  it("donne le titre des chansons d'une playlist, retirées comprises", async () => {
    const [a, b] = [await insertSong("Publiée"), await insertSong("Retirée")];
    await db.update(songs).set({ status: "removed" }).where(eq(songs.id, b));
    const labels = await songLabelsOf([a, b, "s-sidi-mansour"]);
    expect(labels.get(a)).toMatchObject({ song: { titleLatin: "Publiée" }, removed: false });
    expect(labels.get(b)).toMatchObject({ song: { titleLatin: "Retirée" }, removed: true });
    expect(labels.has("s-sidi-mansour")).toBe(false);
  });
});
