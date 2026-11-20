import { describe, expect, it } from "vitest";
import { diffLines, diffStats, segmentDiff, type DiffLine } from "@/lib/moderation/diff";

const same = (text: string): DiffLine => ({ kind: "same", text });
const added = (text: string): DiffLine => ({ kind: "added", text });
const removed = (text: string): DiffLine => ({ kind: "removed", text });

describe("diffLines : différences ligne par ligne des paroles", () => {
  it("ne signale aucune différence entre deux textes identiques", () => {
    expect(diffLines("يا ليل\nطوّل شوية", "يا ليل\nطوّل شوية")).toEqual([same("يا ليل"), same("طوّل شوية")]);
  });

  it("repère une ligne ajoutée au milieu", () => {
    expect(diffLines("سطر أول\nسطر ثالث", "سطر أول\nسطر ثاني\nسطر ثالث")).toEqual([
      same("سطر أول"),
      added("سطر ثاني"),
      same("سطر ثالث"),
    ]);
  });

  it("repère une ligne retirée", () => {
    expect(diffLines("سطر أول\nسطر ثاني\nسطر ثالث", "سطر أول\nسطر ثالث")).toEqual([
      same("سطر أول"),
      removed("سطر ثاني"),
      same("سطر ثالث"),
    ]);
  });

  it("présente une ligne modifiée comme l'ancienne retirée puis la nouvelle ajoutée, à sa place", () => {
    expect(diffLines("سطر أول\nسطر غالط\nسطر ثالث", "سطر أول\nسطر صحيح\nسطر ثالث")).toEqual([
      same("سطر أول"),
      removed("سطر غالط"),
      added("سطر صحيح"),
      same("سطر ثالث"),
    ]);
  });

  it("regroupe plusieurs lignes modifiées d'affilée : toutes les anciennes, puis toutes les nouvelles", () => {
    expect(diffLines("أ\nب\nج\nد", "أ\nب2\nج2\nد")).toEqual([
      same("أ"),
      removed("ب"),
      removed("ج"),
      added("ب2"),
      added("ج2"),
      same("د"),
    ]);
  });

  it("repère deux vers inversés : un vers sort de sa place et revient plus loin", () => {
    expect(diffLines("أ\nب\nج", "أ\nج\nب")).toEqual([same("أ"), removed("ب"), same("ج"), added("ب")]);
  });

  it("garde les lignes vides entre les couplets comme des lignes à part entière", () => {
    expect(diffLines("أ\n\nب", "أ\n\nب\nج")).toEqual([same("أ"), same(""), same("ب"), added("ج")]);
  });

  it("montre toutes les lignes comme ajoutées quand il n'y a pas de version précédente", () => {
    expect(diffLines("", "أ\nب")).toEqual([added("أ"), added("ب")]);
  });

  it("montre toutes les lignes comme retirées quand la nouvelle version est vide", () => {
    expect(diffLines("أ\nب", "")).toEqual([removed("أ"), removed("ب")]);
  });

  it("ignore les fins de ligne Windows, les espaces en fin de ligne et les lignes vides en trop", () => {
    expect(diffLines("أ\r\nب  \n\n\n\nج\n", "أ\nب\n\nج")).toEqual([same("أ"), same("ب"), same(""), same("ج")]);
  });
});

describe("diffStats", () => {
  it("compte les lignes ajoutées et retirées, sans les lignes identiques", () => {
    expect(diffStats([same("أ"), removed("ب"), added("ب2"), added("ج")])).toEqual({ added: 2, removed: 1 });
  });
});

describe("segmentDiff : replie les longues suites de lignes identiques", () => {
  const unchanged = (n: number, prefix = "س") => Array.from({ length: n }, (_, i) => same(`${prefix}${i + 1}`));

  it("laisse visible un diff court", () => {
    const lines = [same("أ"), removed("ب"), added("ب2"), same("ج")];
    expect(segmentDiff(lines)).toEqual([{ hidden: false, lines }]);
  });

  it("replie le début d'une longue suite identique en gardant 2 lignes de contexte avant le changement", () => {
    const lines = [...unchanged(6), added("جديد")];
    expect(segmentDiff(lines)).toEqual([
      { hidden: true, lines: lines.slice(0, 4) },
      { hidden: false, lines: lines.slice(4) },
    ]);
  });

  it("replie le milieu d'une longue suite identique entre deux changements", () => {
    const lines = [removed("قديم"), ...unchanged(8), added("جديد")];
    expect(segmentDiff(lines)).toEqual([
      { hidden: false, lines: lines.slice(0, 3) },
      { hidden: true, lines: lines.slice(3, 7) },
      { hidden: false, lines: lines.slice(7) },
    ]);
  });

  it("replie la fin d'une longue suite identique après le dernier changement", () => {
    const lines = [added("جديد"), ...unchanged(5)];
    expect(segmentDiff(lines)).toEqual([
      { hidden: false, lines: lines.slice(0, 3) },
      { hidden: true, lines: lines.slice(3) },
    ]);
  });

  it("ne replie pas moins de 3 lignes : les montrer coûte moins qu'un bouton", () => {
    const lines = [removed("قديم"), ...unchanged(6), added("جديد")];
    expect(segmentDiff(lines)).toEqual([{ hidden: false, lines }]);
  });

  it("garde tout visible quand aucune ligne n'a changé", () => {
    const lines = unchanged(10);
    expect(segmentDiff(lines)).toEqual([{ hidden: false, lines }]);
  });
});
