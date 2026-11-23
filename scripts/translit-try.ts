// Plan 4, tâche 6 : essai manuel de la translittération par Claude (spec §13), sur une chanson de la base.
// En lecture seule : rien n'est écrit, ni la translittération ni le plafond. Demande ANTHROPIC_API_KEY.
import "dotenv/config";
import { eq } from "drizzle-orm";
import { db, pool } from "@/lib/db/client";
import { isUuid } from "@/lib/db/uuid";
import { songs } from "@/lib/db/schema";
import { anthropicGenerator } from "@/lib/translit/anthropic";
import { generateAligned } from "@/lib/translit/generate";

async function main(): Promise<void> {
  const songId = process.argv[2] ?? "";
  if (!isUuid(songId)) throw new Error("Usage : pnpm translit:try <identifiant de la chanson>");
  const [song] = await db.select({ lyrics: songs.lyrics, dialect: songs.dialect }).from(songs).where(eq(songs.id, songId));
  if (!song) throw new Error(`Aucune chanson ${songId}.`);

  const started = Date.now();
  const result = await generateAligned(anthropicGenerator({ model: process.env.TRANSLIT_MODEL?.trim() || undefined }), song);
  console.log(`Durée : ${Date.now() - started} ms`);
  if (!result.ok) {
    console.error(`Échec : ${result.reason}`);
    process.exitCode = 1;
    return;
  }
  const latin = result.text.split("\n");
  song.lyrics.split("\n").forEach((line, i) => console.log(`${line}\n    ${latin[i]}`));
}

main()
  .catch((e: unknown) => {
    console.error(e instanceof Error ? e.message : e);
    process.exitCode = 1;
  })
  .finally(() => pool.end());
