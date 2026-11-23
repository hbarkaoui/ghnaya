// Plan 4, tâche 5 : l'action « requestTranslit » revérifie la session et l'identifiant (spec §7, §12).
import { eq } from "drizzle-orm";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { toCurrentUser, type CurrentUser } from "@/lib/auth/types";
import { db } from "@/lib/db/client";
import { songs, users } from "@/lib/db/schema";
import { fakeTranslit } from "@/lib/translit/fake";
import { insertSong, insertUser } from "./factories";
import { resetDb } from "./helpers";

const session = vi.hoisted(() => ({ user: null as CurrentUser | null }));
vi.mock("@/lib/session", () => ({ getCurrentUser: async () => session.user }));

const { requestTranslit } = await import("@/app/actions/translit");

beforeEach(async () => {
  await resetDb();
  session.user = null;
  vi.stubEnv("TRANSLIT_PROVIDER", "fake");
  vi.stubEnv("TRANSLIT_DAILY_LIMIT", "");
});

describe("requestTranslit", () => {
  it("un visiteur est invité à se connecter", async () => {
    const id = await insertSong("Ya Lil");
    await expect(requestTranslit(id)).resolves.toEqual({ ok: false, reason: "signin" });
  });

  it("un membre obtient la translittération, enregistrée en base", async () => {
    const id = await insertSong("Ya Lil");
    const { id: userId } = await insertUser();
    const [row] = await db.select().from(users).where(eq(users.id, userId));
    session.user = toCurrentUser(row, []);
    const expected = fakeTranslit("سطر\nسطر");
    await expect(requestTranslit(id)).resolves.toEqual({ ok: true, text: expected, status: "auto" });
    const [song] = await db.select().from(songs).where(eq(songs.id, id));
    expect(song).toMatchObject({ lyricsTranslit: expected, translitStatus: "auto" });
  });

  it("un identifiant qui n'est pas un UUID répond « failed » sans interroger la base", async () => {
    await expect(requestTranslit("s-sidi-mansour")).resolves.toEqual({ ok: false, reason: "failed" });
  });
});
