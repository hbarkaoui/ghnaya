import { describe, expect, it } from "vitest";
import { highlightSnippet } from "@/lib/search/highlight";
import { prepareQuery } from "@/lib/search/query";

describe("highlightSnippet", () => {
  it("surligne le passage arabe trouvé", () => {
    expect(highlightSnippet("فلا بد أن يستجيب القدر", prepareQuery("يستجيب القدر"))).toEqual([
      { text: "فلا بد أن ", hit: false },
      { text: "يستجيب القدر", hit: true },
    ]);
  });

  it("retrouve le passage malgré les signes diacritiques et les variantes de lettres, sans toucher au texte", () => {
    expect(highlightSnippet("خلّي الغناية تكمّل", prepareQuery("الغنايه"))).toEqual([
      { text: "خلّي ", hit: false },
      { text: "الغناية", hit: true },
      { text: " تكمّل", hit: false },
    ]);
  });

  it("étend le surlignage aux mots entiers, pour ne pas couper les lettres liées", () => {
    expect(highlightSnippet("فلا بد أن يستجيب القدر", prepareQuery("ستجي"))).toEqual([
      { text: "فلا بد أن ", hit: false },
      { text: "يستجيب", hit: true },
      { text: " القدر", hit: false },
    ]);
  });

  it("surligne grâce à la clé de consonnes pour une requête en arabizi", () => {
    expect(highlightSnippet("خلّي الغناية تكمّل", prepareQuery("khalli el ghnaya"))).toEqual([
      { text: "خلّي الغناية", hit: true },
      { text: " تكمّل", hit: false },
    ]);
  });

  it("ne surligne rien quand la ligne ne correspond pas", () => {
    expect(highlightSnippet("خلّي الغناية تكمّل", prepareQuery("zzzz"))).toEqual([
      { text: "خلّي الغناية تكمّل", hit: false },
    ]);
  });
});
