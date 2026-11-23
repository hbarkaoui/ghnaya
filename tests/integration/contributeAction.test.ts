// Plan 3, tâche 5 : l'action « Proposer une chanson » (spec §8.1 à §8.3, §8.7, §12 : le serveur refuse).
import { eq } from "drizzle-orm";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { getSongById } from "@/lib/catalog/queries";
import { toCurrentUser, type CurrentUser } from "@/lib/auth/types";
import { db } from "@/lib/db/client";
import { songRevisions, songs, users } from "@/lib/db/schema";
import { REVISION_LIMIT } from "@/lib/moderation/limits";
import { seedFixtures } from "../fixtures/seed";
import { insertUser } from "./factories";
import { resetDb } from "./helpers";

const session = vi.hoisted(() => ({ user: null as CurrentUser | null }));

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
// Les messages d'erreur sont rendus sous la forme de leur clé : le test lit le code d'erreur.
vi.mock("next-intl/server", () => ({
  getTranslations: async () => (key: string) => key,
  getLocale: async () => "fr",
}));

const { submitProposal } = await import("@/app/actions/contribute");

const INITIAL = { errors: {}, attempt: 0 };
const LYRICS = "يا نسيم الليل سلّم\nعلى الحبايب في الدار";

function proposalForm(over: {
  titleAr?: string;
  titleLatin?: string;
  artists?: string[];
  lyrics?: string;
  dialect?: string;
  translit?: string;
  rights?: boolean;
} = {}): FormData {
  const data = new FormData();
  data.set("titleAr", over.titleAr ?? "");
  data.set("titleLatin", over.titleLatin ?? "Lamma Bada");
  for (const artist of over.artists ?? ["Hedi Jouini"]) data.append("artist", artist);
  data.set("lyrics", over.lyrics ?? LYRICS);
  data.set("dialect", over.dialect ?? "tn");
  data.set("translit", over.translit ?? "");
  if (over.rights !== false) data.set("rights", "on");
  return data;
}

/** Soit l'état renvoyé au formulaire, soit l'adresse de la redirection. */
async function submit(songId: string | null, data: FormData) {
  try {
    return { state: await submitProposal(songId, INITIAL, data) };
  } catch (error) {
    const match = /^REDIRECT (.+)$/.exec(error instanceof Error ? error.message : "");
    if (!match) throw error;
    return { redirect: match[1] };
  }
}

async function signIn(userId: string): Promise<void> {
  const [row] = await db.select().from(users).where(eq(users.id, userId));
  session.user = toCurrentUser(row, []);
}

const revisions = () => db.select().from(songRevisions);

describe("proposer une chanson", () => {
  let ids = new Map<string, string>();
  let leila: { id: string };

  beforeEach(async () => {
    await resetDb();
    ids = await seedFixtures(db);
    leila = await insertUser({ name: "Leïla" });
    await signIn(leila.id);
  });

  it("renvoie un visiteur vers la connexion", async () => {
    session.user = null;
    expect(await submit(null, proposalForm())).toEqual({ redirect: "/connexion?retour=%2Fcontribuer" });
    expect(await revisions()).toHaveLength(0);
  });

  it("refuse une adresse non vérifiée (spec §8.7)", async () => {
    await signIn((await insertUser({ emailVerified: false })).id);
    const result = await submit(null, proposalForm());
    expect(result).toMatchObject({ state: { errors: { form: "emailNotVerified" }, attempt: 1 } });
    expect(await revisions()).toHaveLength(0);
  });

  it("enregistre un ajout en attente : l'artiste connu est retrouvé, l'inconnu reste nouveau", async () => {
    const result = await submit(null, proposalForm({ artists: ["hedi jouini", "Artiste Nouveau"] }));
    expect(result.redirect).toMatch(/^\/mes-contributions\?envoyee=[0-9a-f-]{36}$/);

    const [row] = await revisions();
    expect(row).toMatchObject({ authorId: leila.id, songId: null, status: "pending", rightsDeclared: true });
    const jouini = (await getSongById(ids.get("s-ya-lella")!))!.artists[0];
    expect(row.payload).toMatchObject({
      titleLatin: "Lamma Bada",
      titleAr: null,
      lyrics: LYRICS,
      dialect: "tn",
      artists: [
        { id: jouini.id, nameLatin: "Hedi Jouini" },
        { id: null, nameLatin: "Artiste Nouveau" },
      ],
    });
  });

  it("enregistre une correction, puis refuse une seconde correction de la même chanson (spec §8.3)", async () => {
    const id = ids.get("s-ya-lella")!;
    const song = (await getSongById(id))!;
    const correction = () =>
      proposalForm({
        titleAr: song.titleAr ?? "",
        titleLatin: "Ya Lella (version de Tunis)",
        lyrics: song.lyrics,
        translit: song.lyricsTranslit ?? "",
        dialect: song.dialect,
      });
    expect((await submit(id, correction())).redirect).toMatch(/^\/mes-contributions\?envoyee=/);
    expect(await submit(id, correction())).toMatchObject({ state: { errors: { form: "pendingExists" } } });
    expect(await revisions()).toHaveLength(1);
  });

  it("refuse une correction qui ne change rien", async () => {
    const id = ids.get("s-ya-lella")!;
    const song = (await getSongById(id))!;
    const same = proposalForm({
      titleAr: song.titleAr ?? "",
      titleLatin: song.titleLatin ?? "",
      lyrics: song.lyrics,
      translit: song.lyricsTranslit ?? "",
      dialect: song.dialect,
    });
    expect(await submit(id, same)).toMatchObject({ state: { errors: { form: "unchanged" } } });
    expect(await revisions()).toHaveLength(0);
  });

  it("refuse la correction d'une chanson retirée ou inconnue", async () => {
    const removed = ids.get("s-habaytak")!;
    await db.update(songs).set({ status: "removed" }).where(eq(songs.id, removed));
    expect(await submit(removed, proposalForm())).toMatchObject({ state: { errors: { form: "songMissing" } } });
    expect(await submit("s-sidi-mansour", proposalForm())).toMatchObject({ state: { errors: { form: "songMissing" } } });
  });

  it("refuse le formulaire invalide, sans rien écrire ni compter dans la limite du jour", async () => {
    const result = await submit(null, proposalForm({ rights: false, lyrics: "قصير" }));
    expect(result).toMatchObject({ state: { errors: { rights: "rightsMissing", lyrics: "lyricsTooShort" } } });
    expect(await revisions()).toHaveLength(0);
    for (let i = 0; i < REVISION_LIMIT.limit; i += 1) {
      expect((await submit(null, proposalForm({ titleLatin: `Titre ${i}` }))).redirect).toBeDefined();
    }
  });

  it(`refuse la ${REVISION_LIMIT.limit + 1}e proposition du jour (spec §8.7)`, async () => {
    for (let i = 0; i < REVISION_LIMIT.limit; i += 1) {
      expect((await submit(null, proposalForm({ titleLatin: `Titre ${i}` }))).redirect).toBeDefined();
    }
    expect(await submit(null, proposalForm({ titleLatin: "Une de trop" }))).toMatchObject({
      state: { errors: { form: "tooMany" } },
    });
    expect(await revisions()).toHaveLength(REVISION_LIMIT.limit);
  });
});
