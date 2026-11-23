// Plan 1, tâche 6 : écriture des artistes, fusionnés sur leur clé d'identité.
import { eq, sql } from "drizzle-orm";
import type { Executor } from "@/lib/db/client";
import { artists } from "@/lib/db/schema";
import { normalizeLatin } from "@/lib/text/normalizeLatin";
import { artistSearchColumns, type ArtistNames } from "./searchColumns";

export interface ArtistInput {
  nameAr?: string;
  nameLatin?: string;
  aliases?: string[];
}

export interface UpsertedArtist {
  id: string;
  identityKey: string;
  names: ArtistNames;
}

export function artistIdentityKey(a: { nameAr?: string | null; nameLatin?: string | null }): string {
  const name = a.nameLatin ?? a.nameAr;
  if (!name) throw new Error("Un artiste doit avoir un nom arabe ou latin.");
  return normalizeLatin(name);
}

export async function upsertArtist(db: Executor, input: ArtistInput): Promise<UpsertedArtist> {
  const identityKey = artistIdentityKey(input);
  const [row] = await db
    .insert(artists)
    .values({
      nameAr: input.nameAr ?? null,
      nameLatin: input.nameLatin ?? null,
      aliases: input.aliases ?? [],
      identityKey,
    })
    .onConflictDoUpdate({
      target: artists.identityKey,
      set: {
        nameAr: sql`COALESCE(${artists.nameAr}, excluded.name_ar)`,
        nameLatin: sql`COALESCE(${artists.nameLatin}, excluded.name_latin)`,
        aliases: sql`ARRAY(SELECT DISTINCT unnest(${artists.aliases} || excluded.aliases))`,
        updatedAt: sql`now()`,
      },
    })
    .returning();
  const names: ArtistNames = { nameAr: row.nameAr, nameLatin: row.nameLatin, aliases: row.aliases };
  await db.update(artists).set(artistSearchColumns(names)).where(eq(artists.id, row.id));
  return { id: row.id, identityKey, names };
}
