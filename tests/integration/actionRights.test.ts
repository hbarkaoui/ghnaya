// Revue de la branche du plan 2 : les actions serveur refusent ce que l'utilisateur n'a pas le droit de faire.
// Une action est joignable directement par POST : chaque test retire la vérification d'un droit et doit échouer.
import { eq } from "drizzle-orm";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { toCurrentUser, type CurrentUser } from "@/lib/auth/types";
import { membershipsOf } from "@/lib/clubs/queries";
import { db } from "@/lib/db/client";
import { clubMembers, clubs, playlistItems, playlists, users } from "@/lib/db/schema";
import { getPlaylist } from "@/lib/playlist/queries";
import { createPlaylist } from "@/lib/playlist/write";
import { insertClub, insertSong, insertUser } from "./factories";
import { resetDb } from "./helpers";

const session = vi.hoisted(() => ({ user: null as CurrentUser | null }));
const signOut = vi.hoisted(() => vi.fn(async () => undefined));

vi.mock("@/lib/session", () => ({ getCurrentUser: async () => session.user }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn(), refresh: vi.fn() }));
vi.mock("next/navigation", () => ({
  redirect: (url: string) => {
    throw new Error(`REDIRECT ${url}`);
  },
  notFound: () => {
    throw new Error("NOT_FOUND");
  },
  RedirectType: { push: "push", replace: "replace" },
}));
vi.mock("next/headers", () => ({ headers: async () => new Headers() }));
vi.mock("@/lib/auth/auth", () => ({ getAuth: () => ({ api: { signOut } }) }));

const { addSongToPlaylist, createPlaylistWithSong } = await import("@/app/actions/addToPlaylist");
const {
  createClubPlaylistAction,
  deleteClubAction,
  joinClubAction,
  promoteMemberAction,
  regenerateInviteAction,
  renameClubAction,
} = await import("@/app/actions/clubs");
const { copyPlaylistToMine, deletePlaylistAction, movePlaylistSong, renamePlaylistAction } = await import(
  "@/app/actions/playlist"
);
const { deleteAccount, renameUserAction } = await import("@/app/actions/account");

const REFUSED = "Réservé aux animateurs du club.";

const form = (fields: Record<string, string> = {}) => {
  const data = new FormData();
  for (const [key, value] of Object.entries(fields)) data.set(key, value);
  return data;
};

/** Connecte `userId` : l'utilisateur tel que `getCurrentUser` le lirait en base. */
async function signIn(userId: string): Promise<CurrentUser> {
  const [row] = await db.select().from(users).where(eq(users.id, userId));
  session.user = toCurrentUser(row, await membershipsOf(userId));
  return session.user;
}

const clubRow = async (id: string) => (await db.select().from(clubs).where(eq(clubs.id, id)))[0];
const roleOf = async (clubId: string, userId: string) =>
  (await db.select().from(clubMembers).where(eq(clubMembers.clubId, clubId))).find((m) => m.userId === userId)?.role;
const playlistCount = async () => (await db.select().from(playlists)).length;
const itemsOf = async (playlistId: string) =>
  (await db.select().from(playlistItems).where(eq(playlistItems.playlistId, playlistId)))
    .sort((a, b) => a.position - b.position)
    .map((i) => i.songId);

/** Un club « Les Jasmins » : Sami l'anime, Leïla et Nour en sont membres ; une playlist du club à deux chansons. */
async function jasmins() {
  const sami = await insertUser({ name: "Sami", isAnimator: true });
  const leila = await insertUser({ name: "Leïla" });
  const nour = await insertUser({ name: "Nour" });
  const club = await insertClub({
    name: "Les Jasmins",
    slug: "jasmins",
    inviteCode: "jasmins234",
    animatorIds: [sami.id],
    memberIds: [leila.id, nour.id],
  });
  const [a, b] = [await insertSong("A"), await insertSong("B")];
  const playlistId = await createPlaylist(db, { name: "Soirée", owner: { clubId: club.id }, createdBy: sami.id });
  await db.insert(playlistItems).values([
    { playlistId, songId: a, position: 1 },
    { playlistId, songId: b, position: 2 },
  ]);
  return { sami, leila, nour, club, playlistId, songs: [a, b] as const };
}

beforeEach(async () => {
  await resetDb();
  session.user = null;
  signOut.mockClear();
});

describe("réglages d'un club", () => {
  it("refusés à un simple membre, sans rien changer", async () => {
    const { leila, nour, club } = await jasmins();
    await signIn(leila.id);

    await expect(renameClubAction("jasmins", null, form({ name: "Autre" }))).rejects.toThrow(REFUSED);
    await expect(promoteMemberAction("jasmins", nour.id)).rejects.toThrow(REFUSED);
    await expect(regenerateInviteAction("jasmins")).rejects.toThrow(REFUSED);
    await expect(deleteClubAction("jasmins", null, form({ confirmName: "Les Jasmins" }))).rejects.toThrow(REFUSED);
    await expect(createClubPlaylistAction("jasmins", null, form({ name: "Pirate" }))).rejects.toThrow(REFUSED);

    expect(await clubRow(club.id)).toMatchObject({ name: "Les Jasmins", inviteCode: "jasmins234" });
    expect(await roleOf(club.id, nour.id)).toBe("member");
    expect(await playlistCount()).toBe(1);
  });

  it("refusés à l'animateur d'un autre club, et à un visiteur", async () => {
    const { club } = await jasmins();
    const other = await insertUser({ isAnimator: true });
    await insertClub({ name: "Ailleurs", animatorIds: [other.id] });
    await signIn(other.id);
    await expect(renameClubAction("jasmins", null, form({ name: "Autre" }))).rejects.toThrow(REFUSED);
    session.user = null;
    await expect(regenerateInviteAction("jasmins")).rejects.toThrow(REFUSED);
    expect(await clubRow(club.id)).toMatchObject({ name: "Les Jasmins", inviteCode: "jasmins234" });
  });

  it("permis à son animateur : renommer, promouvoir, régénérer le lien", async () => {
    const { sami, nour, club } = await jasmins();
    await signIn(sami.id);

    expect(await renameClubAction("jasmins", null, form({ name: "Les Oliviers" }))).toEqual({ done: "Les Oliviers" });
    expect((await clubRow(club.id)).name).toBe("Les Oliviers");

    expect(await promoteMemberAction("jasmins", nour.id)).toEqual({ done: nour.id });
    expect(await roleOf(club.id, nour.id)).toBe("animator");

    expect(await regenerateInviteAction("jasmins")).toEqual({ done: "regenerated" });
    const code = (await clubRow(club.id)).inviteCode;
    expect(code).not.toBe("jasmins234");

    // L'ancien lien ne mène plus nulle part.
    const newcomer = await insertUser();
    await signIn(newcomer.id);
    expect(await joinClubAction("jasmins234", null, form())).toEqual({ error: "invalid" });
    await expect(joinClubAction(code, null, form())).rejects.toThrow("REDIRECT /clubs/jasmins?statut=rejoint");
  });

  it("permis à son animateur : créer une playlist du club", async () => {
    const { sami } = await jasmins();
    await signIn(sami.id);
    expect(await createClubPlaylistAction("jasmins", null, form({ name: "Répétition" }))).toEqual({ done: "Répétition" });
    expect(await playlistCount()).toBe(2);
  });

  it("suppression : refusée si le nom confirmé ne correspond pas, faite sinon", async () => {
    const { sami, club } = await jasmins();
    await signIn(sami.id);
    expect(await deleteClubAction("jasmins", null, form({ confirmName: "Les Jasmin" }))).toEqual({ error: "mismatch" });
    expect(await clubRow(club.id)).toBeDefined();
    await expect(deleteClubAction("jasmins", null, form({ confirmName: "Les Jasmins" }))).rejects.toThrow(
      "REDIRECT /clubs?statut=supprime",
    );
    expect(await clubRow(club.id)).toBeUndefined();
  });
});

describe("rejoindre un club", () => {
  it("refuse un code mal formé avant de toucher à la base", async () => {
    await jasmins();
    const newcomer = await insertUser();
    await signIn(newcomer.id);
    for (const code of ["", "court", "jasmins234/../x", "jasmins2345"]) {
      expect(await joinClubAction(code, null, form())).toEqual({ error: "invalid" });
    }
    expect(await joinClubAction(42 as unknown as string, null, form())).toEqual({ error: "invalid" });
    expect(await joinClubAction(null as unknown as string, null, form())).toEqual({ error: "invalid" });
    expect(await membershipsOf(newcomer.id)).toEqual([]);
  });

  it("envoie un visiteur à la connexion avec le code relu", async () => {
    await expect(joinClubAction(" JASMINS234 ", null, form())).rejects.toThrow(
      `REDIRECT /connexion?retour=${encodeURIComponent("/rejoindre/jasmins234")}`,
    );
  });
});

describe("ajouter à une playlist", () => {
  it("refuse la playlist d'un club dont on n'est que membre, ou d'un autre club", async () => {
    const { leila, playlistId, songs } = await jasmins();
    const song = await insertSong("C");
    await signIn(leila.id);
    expect(await addSongToPlaylist(playlistId, song)).toEqual({ status: "forbidden" });

    const other = await insertUser({ isAnimator: true });
    await insertClub({ name: "Ailleurs", animatorIds: [other.id] });
    await signIn(other.id);
    expect(await addSongToPlaylist(playlistId, song)).toEqual({ status: "forbidden" });
    expect(await itemsOf(playlistId)).toEqual([...songs]);
  });

  it("refuse la playlist personnelle d'un autre", async () => {
    const { leila, nour } = await jasmins();
    const song = await insertSong("C");
    const mine = await createPlaylist(db, { name: "À moi", owner: { userId: nour.id }, createdBy: nour.id });
    await signIn(leila.id);
    expect(await addSongToPlaylist(mine, song)).toEqual({ status: "forbidden" });
    expect(await itemsOf(mine)).toEqual([]);
  });

  it("permet à l'animateur d'ajouter à la playlist du club", async () => {
    const { sami, playlistId, songs } = await jasmins();
    const song = await insertSong("C");
    await signIn(sami.id);
    expect(await addSongToPlaylist(playlistId, song)).toMatchObject({ status: "added" });
    expect(await itemsOf(playlistId)).toEqual([...songs, song]);
  });

  it("refuse de créer une playlist dans un club qu'on n'anime pas", async () => {
    const { leila } = await jasmins();
    const song = await insertSong("C");
    await signIn(leila.id);
    expect(await createPlaylistWithSong({ name: "Pirate", clubSlug: "jasmins", songId: song })).toEqual({
      status: "forbidden",
    });
    expect(await createPlaylistWithSong({ name: "Pirate", clubSlug: "inconnu", songId: song })).toEqual({
      status: "forbidden",
    });
    expect(await playlistCount()).toBe(1);
  });
});

describe("modifier une playlist de club", () => {
  it("refusé à un membre : supprimer, renommer, déplacer", async () => {
    const { leila, playlistId, songs } = await jasmins();
    await signIn(leila.id);

    expect(await deletePlaylistAction(playlistId, null, form())).toEqual({ error: "forbidden" });
    expect(await renamePlaylistAction(playlistId, "Pirate")).toEqual({ ok: false, error: "forbidden" });
    await movePlaylistSong(playlistId, songs[1], "up");

    expect(await getPlaylist(playlistId)).toMatchObject({ name: "Soirée" });
    expect(await itemsOf(playlistId)).toEqual([...songs]);
  });

  it("permis à l'animateur", async () => {
    const { sami, playlistId, songs } = await jasmins();
    await signIn(sami.id);
    expect(await renamePlaylistAction(playlistId, "Répétition")).toEqual({ ok: true, name: "Répétition" });
    await movePlaylistSong(playlistId, songs[1], "up");
    expect(await itemsOf(playlistId)).toEqual([songs[1], songs[0]]);
    await expect(deletePlaylistAction(playlistId, null, form())).rejects.toThrow("REDIRECT /clubs/jasmins");
    expect(await getPlaylist(playlistId)).toBeNull();
  });
});

describe("copier dans mes playlists", () => {
  it("permis à un membre du club", async () => {
    const { leila, playlistId, songs } = await jasmins();
    await signIn(leila.id);
    const result = await copyPlaylistToMine(playlistId);
    expect(result).toMatchObject({ ok: true });
    const copy = await getPlaylist((result as { id: string }).id);
    expect(copy).toMatchObject({ club: null, ownerId: leila.id, name: "Soirée" });
    expect(await itemsOf(copy!.id)).toEqual([...songs]);
  });

  it("refusé pour une playlist personnelle, et hors du club", async () => {
    const { leila, nour, playlistId } = await jasmins();
    const personal = await createPlaylist(db, { name: "À moi", owner: { userId: nour.id }, createdBy: nour.id });
    await signIn(leila.id);
    expect(await copyPlaylistToMine(personal)).toEqual({ ok: false });

    const outsider = await insertUser();
    await signIn(outsider.id);
    expect(await copyPlaylistToMine(playlistId)).toEqual({ ok: false });
    expect(await playlistCount()).toBe(2);
  });
});

describe("compte", () => {
  it("renvoie un visiteur à la connexion", async () => {
    const signInUrl = "REDIRECT /connexion?retour=/moi/compte";
    await expect(renameUserAction(null, form({ name: "Pirate" }))).rejects.toThrow(signInUrl);
    await expect(deleteAccount()).rejects.toThrow(signInUrl);
    expect(signOut).not.toHaveBeenCalled();
  });

  it("ne supprime pas le seul animateur d'un club", async () => {
    const { sami } = await jasmins();
    await signIn(sami.id);
    await expect(deleteAccount()).rejects.toThrow("REDIRECT /moi/compte");
    expect(signOut).not.toHaveBeenCalled();
    expect((await db.select().from(users).where(eq(users.id, sami.id))).length).toBe(1);
  });

  it("supprime un membre, après l'avoir déconnecté", async () => {
    const { leila } = await jasmins();
    await signIn(leila.id);
    await expect(deleteAccount()).rejects.toThrow("REDIRECT /moi?compte=supprime");
    expect(signOut).toHaveBeenCalledOnce();
    expect((await db.select().from(users).where(eq(users.id, leila.id))).length).toBe(0);
  });

  it("renomme le compte connecté", async () => {
    const { leila } = await jasmins();
    await signIn(leila.id);
    expect(await renameUserAction(null, form({ name: "Leïla B." }))).toEqual({ done: "Leïla B." });
    expect((await db.select().from(users).where(eq(users.id, leila.id)))[0].name).toBe("Leïla B.");
  });
});
