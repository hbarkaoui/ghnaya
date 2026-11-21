import { describe, expect, it } from "vitest";
import { findSnippet, prepareQuery } from "@/lib/search/query";

// Repris du plan 1, tâche 7.

describe("prepareQuery", () => {
  it("requête arabe : pas de partie latine", () => {
    expect(prepareQuery(" سيدى منصور ")).toEqual({ significant: 9, ar: "سيدي منصور", lat: "", key: "sdmnsr" });
  });
  it("requête latine : pas de partie arabe", () => {
    expect(prepareQuery("Sidi Mansour")).toEqual({ significant: 11, ar: "", lat: "sidi mansour", key: "sdmnsr" });
  });
});

describe("findSnippet", () => {
  it("renvoie la première ligne qui correspond", () => {
    const lyrics = "إذا الشعب يوما أراد الحياة\nفلا بد أن يستجيب القدر";
    expect(findSnippet(lyrics, prepareQuery("يستجيب القدر"))).toBe("فلا بد أن يستجيب القدر");
    expect(findSnippet(lyrics, prepareQuery("zzzz"))).toBeNull();
  });

  it("à défaut de la phrase exacte, renvoie la première ligne qui a tous les mots de la requête", () => {
    const lyrics = "يا ندم\nتفيد بإيه، إيه، إيه يا ندم، يا ندم";
    expect(findSnippet(lyrics, prepareQuery("تفيد بإيه يا ندم"))).toBe("تفيد بإيه، إيه، إيه يا ندم، يا ندم");
  });

  it("sinon, renvoie la ligne qui a le plus de mots de la requête", () => {
    const lyrics = "يا ندم يا ندم\nتفيد بإيه\nتفيد بإيه يا ندم";
    expect(findSnippet("تفيد بإيه\nوتعمل إيه يا ندم", prepareQuery("تفيد بإيه يا ندم"))).toBe("تفيد بإيه");
    expect(findSnippet(lyrics, prepareQuery("تفيد بإيه يا ندم"))).toBe("تفيد بإيه يا ندم");
  });

  it("ne cherche pas la clé de consonnes dans les paroles pour une requête arabe, comme la requête SQL", () => {
    // « تفيدبإيه », mots collés, a la clé « tfdbh » de la ligne : seule une requête en latin s'en sert.
    expect(findSnippet("تفيد بإيه، إيه يا ندم", prepareQuery("تفيدبإيه"))).toBeNull();
    expect(findSnippet("تفيد بإيه، إيه يا ندم", prepareQuery("tfid bih ya nadm"))).toBe("تفيد بإيه، إيه يا ندم");
  });

  it("préfère la ligne qui a la phrase exacte, même plus loin", () => {
    const lyrics = "تفيد بإيه، إيه يا ندم\nتفيد بإيه يا ندم وتعمل إيه يا عتاب";
    expect(findSnippet(lyrics, prepareQuery("تفيد بإيه يا ندم"))).toBe("تفيد بإيه يا ندم وتعمل إيه يا عتاب");
  });
});
