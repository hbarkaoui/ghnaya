import { describe, expect, it } from "vitest";
import { buildAliasIndex } from "../../../scripts/import/artistAliases";
import { keepBest, transformTrack, type Candidate } from "../../../scripts/import/lrclibTransform";

const ALIASES = buildAliasIndex(`
- name_ar: صابر الرباعي
  name_latin: Saber Rebai
  aliases: [Saber Al Robaii]
`);

describe("buildAliasIndex", () => {
  it("résout une variante vers l'artiste canonique, sinon devine l'écriture", () => {
    expect(ALIASES.resolve("saber al robaii")).toMatchObject({ nameAr: "صابر الرباعي", nameLatin: "Saber Rebai" });
    expect(ALIASES.resolve("بلطي")).toEqual({ nameAr: "بلطي" });
    expect(ALIASES.resolve("Balti")).toEqual({ nameLatin: "Balti" });
    expect(ALIASES.resolve("Fairuz فيروز")).toEqual({ nameAr: "فيروز", nameLatin: "Fairuz" });
  });
});

describe("transformTrack", () => {
  const track = {
    id: 7,
    name: "Sidi Mansour (Official Video)",
    artistName: "Saber Al Robaii",
    plainLyrics: "سطر تجريبي\r\nسطر ثاني",
  };

  it("nettoie le titre, résout l'artiste et calcule la clé de dédoublonnage", () => {
    expect(transformTrack(track, ALIASES)).toEqual({
      lrclibId: 7,
      titleLatin: "Sidi Mansour",
      lyrics: "سطر تجريبي\nسطر ثاني",
      artists: [{ nameAr: "صابر الرباعي", nameLatin: "Saber Rebai", aliases: ["Saber Al Robaii"] }],
      dedupeKey: "saber rebai|sdmnsr",
    });
  });

  it("rejette les paroles non arabes, vides, ou sans artiste", () => {
    expect(transformTrack({ ...track, plainLyrics: "Look at the stars" }, ALIASES)).toEqual({ rejected: "not_arabic" });
    expect(transformTrack({ ...track, plainLyrics: "  " }, ALIASES)).toEqual({ rejected: "empty_lyrics" });
    expect(transformTrack({ ...track, artistName: " , " }, ALIASES)).toEqual({ rejected: "no_artist" });
  });

  it("rejette le persan et l'ourdou, écrits avec l'alphabet arabe", () => {
    const reject = (plainLyrics: string) => transformTrack({ ...track, plainLyrics }, ALIASES);
    // Clavier persan : ی et ک au lieu de ي et ك.
    expect(reject("این که من بی تو")).toEqual({ rejected: "persian_or_urdu" });
    // Persan tapé avec les lettres arabes, mais avec پ : « رازقی پرپر شد ».
    expect(reject("رازقي پرپر شد\nباغ در چله نشست")).toEqual({ rejected: "persian_or_urdu" });
    // Ourdou : ے et ں.
    expect(reject("دل میں ایک لہر سی اٹھی ہے")).toEqual({ rejected: "persian_or_urdu" });
  });

  it("garde l'arabe irakien et du Golfe, qui écrit aussi چ et گ", () => {
    expect(transformTrack({ ...track, plainLyrics: "شلون أنساك وأنت چنت گلبي\nگلبي يا گلبي" }, ALIASES)).not.toHaveProperty(
      "rejected",
    );
  });

  it("ajoute les invités trouvés dans le titre", () => {
    const c = transformTrack({ ...track, name: "Nebni (feat. Balti)" }, ALIASES) as Candidate;
    expect(c.artists.map((a) => a.nameLatin)).toEqual(["Saber Rebai", "Balti"]);
  });

  it("retire les octets nuls du titre et des paroles, que PostgreSQL refuse", () => {
    const c = transformTrack(
      { ...track, name: "Beyond These Doors \u0000 Get up", plainLyrics: "سطر\u0000 تجريبي" },
      ALIASES,
    ) as Candidate;
    expect(c.titleLatin).toBe("Beyond These Doors / Get up");
    expect(c.lyrics).toBe("سطر تجريبي");
  });
});

describe("keepBest", () => {
  const base: Candidate = {
    lrclibId: 2,
    titleLatin: "Sidi Mansour",
    lyrics: "سطر",
    artists: [{ nameLatin: "A" }],
    dedupeKey: "a|sdmnsr",
  };

  it("garde les paroles les plus longues et complète les titres", () => {
    const best = new Map<string, Candidate>();
    keepBest(best, base);
    keepBest(best, { ...base, lrclibId: 9, titleLatin: undefined, titleAr: "سيدي منصور", lyrics: "سطر أطول" });
    expect(best.get("a|sdmnsr")).toMatchObject({ lrclibId: 9, titleAr: "سيدي منصور", titleLatin: "Sidi Mansour" });
  });

  it("à longueur égale, garde le plus petit identifiant", () => {
    const best = new Map<string, Candidate>();
    keepBest(best, { ...base, lrclibId: 5 });
    keepBest(best, { ...base, lrclibId: 3 });
    expect(best.get("a|sdmnsr")?.lrclibId).toBe(3);
  });
});
