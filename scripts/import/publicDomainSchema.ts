// Plan 1, tâche 11 : format des fichiers data/public-domain/*.yaml et règle des droits (spec §11.2).
import { z } from "zod";
import { DIALECTS } from "@/lib/db/schema";

const Artist = z
  .object({ name_ar: z.string().min(1).optional(), name_latin: z.string().min(1).optional() })
  .refine((a) => a.name_ar || a.name_latin, { message: "artiste sans nom" });

export const PublicDomainSongSchema = z
  .object({
    key: z.string().regex(/^[a-z0-9-]+$/),
    title_ar: z.string().min(1).optional(),
    title_latin: z.string().min(1).optional(),
    artists: z.array(Artist).min(1),
    lyricist: z.string().min(1),
    author_death_year: z.number().int().optional(),
    traditional: z.boolean().default(false),
    dialect: z.enum(DIALECTS),
    lyrics: z.string().min(20),
    lyrics_translit: z.string().optional(),
  })
  .refine((s) => s.title_ar || s.title_latin, { message: "titre manquant" });

export const PublicDomainFile = z.array(PublicDomainSongSchema);
export type PublicDomainSong = z.infer<typeof PublicDomainSongSchema>;
export type PdIssue = { key: string; reason: "not_public_domain" | "translit_misaligned" };

/** Œuvre traditionnelle, ou auteur mort depuis plus de 50 ans comptés à partir du 1er janvier suivant le décès. */
export function isPublicDomain(s: { traditional: boolean; author_death_year?: number }, currentYear: number): boolean {
  return s.traditional || (s.author_death_year !== undefined && s.author_death_year <= currentYear - 51);
}

const lineCount = (text: string): number => text.trim().split("\n").length;

export function checkSong(s: PublicDomainSong, currentYear: number): PdIssue | null {
  if (!isPublicDomain(s, currentYear)) return { key: s.key, reason: "not_public_domain" };
  if (s.lyrics_translit !== undefined && lineCount(s.lyrics_translit) !== lineCount(s.lyrics)) {
    return { key: s.key, reason: "translit_misaligned" };
  }
  return null;
}
