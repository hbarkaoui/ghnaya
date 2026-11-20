import { describe, expect, it } from "vitest";
import ar from "../../../messages/ar.json";
import fr from "../../../messages/fr.json";
import { flattenMessages } from "./support/icu";
import { LEXICON, findLexiconViolations, lexiconTermsIn, missingLexiconTerms } from "./support/lexicon";

describe("findLexiconViolations", () => {
  it("signale un synonyme écarté par le lexique, avec la clé et le concept", () => {
    expect(findLexiconViolations({ "a.b": "جارٍ إعداد الكتابة اللاتينية…" }, "ar")).toEqual([
      { key: "a.b", concept: "Translittération", found: "الكتابة اللاتينية" },
    ]);
  });

  it("distingue « بلاغ » (écarté) de « إبلاغ » (le terme retenu)", () => {
    expect(findLexiconViolations({ ok: "تمّ إرسال الإبلاغ", ko: "عرض البلاغات" }, "ar").map((v) => v.key)).toEqual(["ko"]);
  });

  it("n'accepte « Contribution » que dans « Mes contributions »", () => {
    expect(
      findLexiconViolations({ ok: "Voir mes contributions", ko: "Merci pour votre contribution" }, "fr").map((v) => v.key),
    ).toEqual(["ko"]);
  });
});

describe("missingLexiconTerms", () => {
  it("signale une clé témoin qui n'emploie pas le terme du lexique", () => {
    expect(missingLexiconTerms({ "playlists.read": "شغّل" }, "ar")).toContainEqual({
      key: "playlists.read",
      concept: "Lire",
      expected: "اقرأ",
    });
  });
});

describe("lexiconTermsIn", () => {
  it("repère les termes du lexique dans un libellé, sous leurs formes courantes", () => {
    expect(lexiconTermsIn("اقرأ «جلسة الخميس» مع ناديكم", "ar")).toEqual(["Club", "Lire", "Séance"]);
    expect(lexiconTermsIn("Lire depuis le début", "fr")).toEqual(["Lire"]);
  });
});

describe("le lexique de l'architecture de l'information", () => {
  it("couvre les 15 concepts des conventions de nommage", () => {
    expect(LEXICON.map((entry) => entry.concept)).toHaveLength(15);
  });

  for (const [locale, messages] of [["ar", ar], ["fr", fr]] as const) {
    const flat = flattenMessages(messages);
    it(`est respecté par messages/${locale}.json : aucun synonyme écarté`, () => {
      expect(findLexiconViolations(flat, locale)).toEqual([]);
    });
    it(`est employé dans messages/${locale}.json par chaque clé témoin`, () => {
      expect(missingLexiconTerms(flat, locale)).toEqual([]);
    });
  }
});
