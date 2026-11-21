// Plan 1, tâche 10 : variantes d'écriture des artistes → artiste canonique (artist-aliases.yaml).
import { parse } from "yaml";
import { z } from "zod";
import type { ArtistInput } from "@/lib/catalog/artists";
import { normalizeLatin } from "@/lib/text/normalizeLatin";
import { splitTitleScripts } from "@/lib/text/titles";

const AliasFile = z.array(
  z.object({
    name_ar: z.string().optional(),
    name_latin: z.string().optional(),
    aliases: z.array(z.string()).default([]),
  }),
);

export interface AliasIndex {
  resolve(name: string): ArtistInput;
}

export function buildAliasIndex(yamlText: string): AliasIndex {
  const entries = AliasFile.parse(parse(yamlText) ?? []);
  const byVariant = new Map<string, ArtistInput>();
  for (const e of entries) {
    const canonical: ArtistInput = { nameAr: e.name_ar, nameLatin: e.name_latin, aliases: e.aliases };
    for (const variant of [e.name_ar, e.name_latin, ...e.aliases]) {
      if (variant) byVariant.set(normalizeLatin(variant), canonical);
    }
  }
  return {
    resolve(name: string): ArtistInput {
      const hit = byVariant.get(normalizeLatin(name));
      if (hit) return hit;
      // Artiste inconnu : on range chaque partie du nom selon son écriture (« Fairuz فيروز »).
      const { titleAr, titleLatin } = splitTitleScripts(name.trim());
      return { ...(titleAr ? { nameAr: titleAr } : {}), ...(titleLatin ? { nameLatin: titleLatin } : {}) };
    },
  };
}
