import { describe, expect, it } from "vitest";
import ar from "../../../messages/ar.json";
import fr from "../../../messages/fr.json";
import { easternDigits, flattenMessages, icuArguments } from "./support/icu";

describe("flattenMessages", () => {
  it("met les messages imbriqués à plat, avec des clés pointées", () => {
    expect(flattenMessages({ a: "x", b: { c: "y", d: { e: "z" } } })).toEqual({ a: "x", "b.c": "y", "b.d.e": "z" });
  });
});

describe("icuArguments", () => {
  it("relève les arguments simples et les balises", () => {
    expect(icuArguments("Vous avez rejoint <club>{name}</club>.")).toEqual(["<club>", "name"]);
  });

  it("relève l'argument d'un pluriel et ceux de ses branches, sans prendre une branche pour un argument", () => {
    expect(icuArguments("{count, plural, =0 {Aucun} one {{n} chanson} other {Toutes}}")).toEqual(["count", "n"]);
  });

  it("ignore le texte arabe des branches", () => {
    expect(icuArguments("{count, plural, zero {لا أغاني} few {{n} أغانٍ} other {{n} أغنية}}")).toEqual(["count", "n"]);
  });
});

describe("easternDigits", () => {
  it("trouve les chiffres arabo-indiens et persans", () => {
    expect(easternDigits("الصفحة ٣ من ۱٢")).toEqual(["٣", "۱", "٢"]);
  });

  it("laisse passer les chiffres occidentaux", () => {
    expect(easternDigits("الصفحة 3 من 12")).toEqual([]);
  });
});

const FR = flattenMessages(fr);
const AR = flattenMessages(ar);

describe("messages/fr.json et messages/ar.json", () => {
  it("ont exactement les mêmes clés", () => {
    expect(Object.keys(AR).filter((k) => !(k in FR))).toEqual([]);
    expect(Object.keys(FR).filter((k) => !(k in AR))).toEqual([]);
  });

  it("ont les mêmes variables et balises ICU, message par message", () => {
    const mismatches = Object.keys(FR)
      .filter((k) => k in AR)
      .filter((k) => icuArguments(FR[k]).join() !== icuArguments(AR[k]).join())
      .map((k) => `${k} : fr [${icuArguments(FR[k])}] / ar [${icuArguments(AR[k])}]`);
    expect(mismatches).toEqual([]);
  });

  it("n'écrivent aucun chiffre arabo-indien : chiffres occidentaux partout, usage tunisien", () => {
    const withDigits = [...Object.entries(AR), ...Object.entries(FR)].filter(([, v]) => easternDigits(v).length > 0);
    expect(withDigits).toEqual([]);
  });

  it("n'utilisent pas « # » dans les pluriels : le nombre affiché arrive en chaîne ({n}), jamais formaté par Intl", () => {
    const withHash = [...Object.entries(AR), ...Object.entries(FR)].filter(([, v]) => v.includes("#")).map(([k]) => k);
    expect(withHash).toEqual([]);
  });
});
