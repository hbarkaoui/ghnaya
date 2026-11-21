import { describe, expect, it } from "vitest";
import { INVITE_CODE_LENGTH, newInviteCode, parseInviteCode } from "@/lib/clubs/invite";
import { CLUB_NAME_MAX, confirmsClubName, validateClubName } from "@/lib/clubs/name";
import { clubSlug, clubSlugBase } from "@/lib/clubs/slug";

describe("clubSlug : identifiant lisible tiré du nom (IA, stratégie d'URL)", () => {
  it("met en minuscules, sans accents, avec des tirets", () => {
    expect(clubSlug("Les Jasmins", [])).toBe("les-jasmins");
    expect(clubSlug("Sidi Bou Saïd Chante", [])).toBe("sidi-bou-said-chante");
    expect(clubSlug("  Fête d'été !  ", [])).toBe("fete-d-ete");
  });

  it("garde les lettres arabes, sans les voyelles brèves", () => {
    expect(clubSlug("نادي الياسمين", [])).toBe("نادي-الياسمين");
    expect(clubSlug("نَادِي", [])).toBe("نادي");
  });

  it("ajoute -2, -3… quand le slug est déjà pris", () => {
    expect(clubSlug("Les Jasmins", ["les-jasmins"])).toBe("les-jasmins-2");
    expect(clubSlug("Les Jasmins", ["les-jasmins", "les-jasmins-2"])).toBe("les-jasmins-3");
  });

  it("évite /clubs/nouveau, déjà pris par la création d'un club", () => {
    expect(clubSlug("Nouveau", [])).toBe("nouveau-2");
  });

  it("se replie sur « club » quand le nom n'a ni lettre ni chiffre", () => {
    expect(clubSlug("!!!", [])).toBe("club");
    expect(clubSlug("!!!", ["club"])).toBe("club-2");
  });
});

describe("clubSlugBase : le slug avant la gestion des doublons", () => {
  it("ne tient compte ni des doublons ni des adresses réservées", () => {
    expect(clubSlugBase("Les  Jasmins")).toBe("les-jasmins");
    expect(clubSlugBase("Nouveau")).toBe("nouveau");
    expect(clubSlugBase("!!!")).toBe("club");
  });
});

describe("newInviteCode : code d'invitation de 10 caractères (spec §10)", () => {
  it("a 10 caractères sans lettres ni chiffres ambigus", () => {
    const code = newInviteCode();
    expect(INVITE_CODE_LENGTH).toBe(10);
    expect(code).toMatch(/^[a-hjkmnp-z2-9]{10}$/);
  });

  it("change à chaque appel", () => {
    expect(newInviteCode()).not.toBe(newInviteCode());
  });
});

describe("parseInviteCode : lien ou code collé par l'utilisateur", () => {
  it("lit le code dans un lien complet, avec ou sans paramètres", () => {
    expect(parseInviteCode("https://ghnaya.tn/rejoindre/k7m2x9pq4r")).toBe("k7m2x9pq4r");
    expect(parseInviteCode("ghnaya.tn/rejoindre/k7m2x9pq4r?utm=wa")).toBe("k7m2x9pq4r");
  });

  it("lit le code dans un message WhatsApp qui contient le lien", () => {
    expect(parseInviteCode("Rejoins notre club : https://ghnaya.tn/rejoindre/k7m2x9pq4r à jeudi")).toBe("k7m2x9pq4r");
  });

  it("accepte le code seul, en majuscules ou entouré d'espaces", () => {
    expect(parseInviteCode("  K7M2X9PQ4R ")).toBe("k7m2x9pq4r");
  });

  it("refuse ce qui n'est ni un lien d'invitation ni un code", () => {
    expect(parseInviteCode("")).toBeNull();
    expect(parseInviteCode("bonjour")).toBeNull();
    expect(parseInviteCode("https://example.com/autre/k7m2x9pq4r")).toBeNull();
  });
});

describe("validateClubName", () => {
  it("nettoie les espaces", () => {
    expect(validateClubName("  Les   Jasmins ")).toEqual({ ok: true, name: "Les Jasmins" });
  });

  it("exige un nom", () => {
    expect(validateClubName("   ")).toEqual({ ok: false, error: "required" });
  });

  it("limite la longueur", () => {
    expect(validateClubName("a".repeat(CLUB_NAME_MAX))).toMatchObject({ ok: true });
    expect(validateClubName("a".repeat(CLUB_NAME_MAX + 1))).toEqual({ ok: false, error: "tooLong" });
  });
});

describe("confirmsClubName : suppression confirmée en retapant le nom", () => {
  it("accepte le nom exact, sans tenir compte des majuscules ni des espaces autour", () => {
    expect(confirmsClubName("Les Jasmins", "Les Jasmins")).toBe(true);
    expect(confirmsClubName(" les jasmins ", "Les Jasmins")).toBe(true);
    expect(confirmsClubName("نادي الياسمين", "نادي الياسمين")).toBe(true);
  });

  it("refuse un nom incomplet ou différent", () => {
    expect(confirmsClubName("Les Jasmin", "Les Jasmins")).toBe(false);
    expect(confirmsClubName("", "Les Jasmins")).toBe(false);
  });
});
