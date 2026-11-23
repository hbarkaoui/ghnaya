import { getSongById } from "@/lib/catalog/queries";
import type { Song } from "@/types/catalog";
import type { ProposalPayload, ProposalStatus } from "@/types/proposal";

/**
 * Propositions de démonstration reprises de la maquette : les trois de Leïla (une de chaque statut) et quatre
 * en attente d'autres contributeurs, pour la file de modération. Importé par `pnpm seed:demo`, jamais par
 * l'application. Les corrections partent des chansons telles que la base les a (UUID des artistes compris).
 * Les paroles sont inventées, comme le reste des données de démonstration.
 */
export interface DemoRevision {
  /** Clé de la personne (`DEMO_PEOPLE`). */
  author: string;
  /** Identifiant fictif de la chanson corrigée (`s-sidi-mansour`), ou `null` pour un ajout. */
  song: string | null;
  payload: ProposalPayload;
  status: ProposalStatus;
  /** Clé de la personne qui a relu, pour une proposition approuvée ou rejetée. */
  reviewer?: string;
  reviewNote?: string;
  /** ISO 8601. */
  createdAt: string;
  reviewedAt?: string;
}

export async function demoRevisions(songIds: ReadonlyMap<string, string>): Promise<DemoRevision[]> {
  const read = async (ref: string): Promise<Song> => {
    const song = await getSongById(songIds.get(ref) ?? "");
    if (!song) throw new Error(`Chanson de démonstration introuvable : ${ref}`);
    return song;
  };
  const artistOf = async (ref: string) => {
    const { id, nameAr, nameLatin } = (await read(ref)).artists[0];
    return { id, nameAr, nameLatin };
  };
  /** La chanson telle quelle, avec les changements proposés. */
  const correction = async (ref: string, change: Partial<ProposalPayload>): Promise<ProposalPayload> => {
    const song = await read(ref);
    return {
      titleAr: song.titleAr,
      titleLatin: song.titleLatin,
      artists: song.artists.map(({ id, nameAr, nameLatin }) => ({ id, nameAr, nameLatin })),
      lyrics: song.lyrics,
      lyricsTranslit: song.lyricsTranslit,
      dialect: song.dialect,
      ...change,
    };
  };
  const jouini = await artistOf("s-ya-lella");
  const saber = await artistOf("s-sidi-mansour");

  return [
    {
      author: "leila",
      song: null,
      payload: {
        titleAr: "لاموني اللي غاروا مني",
        titleLatin: "Lamouni Elli Gharou Menni",
        artists: [jouini],
        lyrics: `قالوا عليّ كلام كثير
وأنا نغنّي ونسامح
والليل يسمع غنايتي
والقلب ديما فرحان`,
        lyricsTranslit: null,
        dialect: "tn",
      },
      status: "pending",
      createdAt: "2026-11-18T20:15:00Z",
    },
    {
      author: "leila",
      song: "s-ya-lella",
      payload: await correction("s-ya-lella", {
        lyricsTranslit: `ya lella ghannili
ghannili ghnaya helwa
khalli ed-dar tdhawi
wel a7bab yetlammou

ya lella ya lella
el lila lilet fra7`,
      }),
      status: "approved",
      reviewer: "rania",
      createdAt: "2026-11-08T18:40:00Z",
      reviewedAt: "2026-11-10T09:05:00Z",
    },
    {
      author: "leila",
      song: null,
      payload: {
        titleAr: "سيدي منصور",
        titleLatin: "Sidi Mansour",
        artists: [saber],
        lyrics: `يا ليل طوّل شوية
خلّي الغناية تكمّل`,
        lyricsTranslit: null,
        dialect: "tn",
      },
      status: "rejected",
      reviewer: "rania",
      reviewNote:
        "Cette chanson est déjà dans Ghnaya. Pour la compléter, ouvrez sa fiche et touchez « Proposer une correction ».",
      createdAt: "2026-11-03T21:00:00Z",
      reviewedAt: "2026-11-04T08:30:00Z",
    },
    // Deux vers corrigés et un vers ajouté en fin de couplet.
    {
      author: "youssef",
      song: "s-sidi-mansour",
      payload: await correction("s-sidi-mansour", {
        lyrics: `يا ليل طوّل شوية
خلّي الغناية تكمّل
نغنّيو مع بعضنا
والقلب فرحان ومتهلّل
والدار ضاوية بينا

يا قمر ضوّي علينا
والنجوم تسهر معانا`,
      }),
      status: "pending",
      createdAt: "2026-11-12T19:30:00Z",
    },
    // Titre latin corrigé, un vers remplacé et un couplet ajouté.
    {
      author: "amira",
      song: "s-taht-el-yasmina",
      payload: await correction("s-taht-el-yasmina", {
        titleLatin: "Taht el Yasmina fel Lil",
        lyrics: `والريح تجيب الريحة
من الجنينة للدار
نغنّيو للّي غايب
والكلمة تمشي صحيحة

يا ياسمينة يا بيضا
خلّي الليل يطول شوية

نغنّي ونفرح سوا
والصبح مازال بعيد`,
      }),
      status: "pending",
      createdAt: "2026-11-14T08:05:00Z",
    },
    // Ajout d'une chanson du répertoire andalou, avec un artiste nouveau et une translittération.
    {
      author: "karim",
      song: null,
      payload: {
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
      status: "pending",
      createdAt: "2026-11-15T21:45:00Z",
    },
    // Seulement un titre latin, absent jusqu'ici : paroles inchangées.
    {
      author: "hedi",
      song: "s-enta-omri",
      payload: await correction("s-enta-omri", { titleLatin: "Enta Omri" }),
      status: "pending",
      createdAt: "2026-11-17T13:20:00Z",
    },
  ];
}
