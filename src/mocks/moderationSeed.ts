import type { Song } from "@/types/catalog";
import type { Proposal, ProposalPayload } from "@/types/proposal";
import { getSong } from "./catalog";

/**
 * MAQUETTE : propositions en attente pour la file de modération (tâche 14), en plus de celle de Leïla
 * (`p-lamouni`, tâche 13). Leurs auteurs n'ont pas de session de démonstration : Mes contributions de
 * Leïla, Sami, Nour et Rania ne changent pas. Les paroles sont inventées, comme le reste des données.
 */

/** Noms des contributeurs de la maquette qui n'ont pas de session de démonstration. */
export const CONTRIBUTOR_NAMES: Record<string, string> = {
  "u-youssef": "Youssef",
  "u-amira": "Amira",
  "u-karim": "Karim",
  "u-hedi": "Hédi",
};

/** Correction : la chanson telle quelle, avec les changements proposés. */
function correction(songId: string, change: (song: Song) => Partial<ProposalPayload>): ProposalPayload {
  const song = getSong(songId);
  if (!song) throw new Error(`Chanson de démonstration introuvable : ${songId}`);
  return {
    titleAr: song.titleAr,
    titleLatin: song.titleLatin,
    artists: song.artists.map(({ id, nameAr, nameLatin }) => ({ id, nameAr, nameLatin })),
    lyrics: song.lyrics,
    lyricsTranslit: song.lyricsTranslit,
    dialect: song.dialect,
    ...change(song),
  };
}

const pending = (id: string, authorId: string, songId: string | null, payload: ProposalPayload, createdAt: string): Proposal => ({
  id,
  songId,
  authorId,
  payload,
  rightsDeclared: true,
  status: "pending",
  reviewNote: null,
  createdAt,
  reviewedAt: null,
});

/**
 * Construites à la demande, à la création du magasin des propositions : les corrections partent du
 * catalogue tel qu'il est au démarrage. Évaluées au chargement du module, elles échoueraient après le
 * retrait d'une de leurs chansons (rechargement à chaud, ou module chargé une seconde fois par Next).
 */
export const moderationSeedProposals = (): Proposal[] => [
  // Deux vers corrigés et un vers ajouté en fin de couplet.
  pending(
    "p-sidi-mansour-vers",
    "u-youssef",
    "s-sidi-mansour",
    correction("s-sidi-mansour", () => ({
      lyrics: `يا ليل طوّل شوية
خلّي الغناية تكمّل
نغنّيو مع بعضنا
والقلب فرحان ومتهلّل
والدار ضاوية بينا

يا قمر ضوّي علينا
والنجوم تسهر معانا`,
    })),
    "2026-11-12T19:30:00Z",
  ),
  // Titre latin corrigé, un vers remplacé et un couplet ajouté.
  pending(
    "p-taht-el-yasmina-couplets",
    "u-amira",
    "s-taht-el-yasmina",
    correction("s-taht-el-yasmina", () => ({
      titleLatin: "Taht el Yasmina fel Lil",
      lyrics: `والريح تجيب الريحة
من الجنينة للدار
نغنّيو للّي غايب
والكلمة تمشي صحيحة

يا ياسمينة يا بيضا
خلّي الليل يطول شوية

نغنّي ونفرح سوا
والصبح مازال بعيد`,
    })),
    "2026-11-14T08:05:00Z",
  ),
  // Ajout d'une chanson du répertoire andalou, avec un artiste nouveau et une translittération.
  pending(
    "p-lamma-bada",
    "u-karim",
    null,
    {
      titleAr: "لمّا بدا يتثنّى",
      titleLatin: "Lamma Bada Yatathanna",
      artists: [{ id: null, nameAr: "تراث أندلسي", nameLatin: "Répertoire andalou" }],
      lyrics: `يا نسيم الليل سلّم
على الحبايب في الدار
قول لهم القلب يغنّي
والشوق ما عندو قرار

يا نسيم الليل عاود
خلّي الغناية تدور`,
      lyricsTranslit: `ya nassim el lil sallem
3la el 7bayeb fi ed-dar
goul lhom el galb yghanni
wech-chouq ma 3andou qrar

ya nassim el lil 3awed
khalli el ghnaya tdour`,
      dialect: "maghreb_other",
    },
    "2026-11-15T21:45:00Z",
  ),
  // Seulement un titre latin, absent jusqu'ici : paroles inchangées.
  pending(
    "p-enta-omri-titre",
    "u-hedi",
    "s-enta-omri",
    correction("s-enta-omri", () => ({ titleLatin: "Enta Omri" })),
    "2026-11-17T13:20:00Z",
  ),
];
