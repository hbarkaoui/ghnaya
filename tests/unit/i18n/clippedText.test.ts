import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { findClippedTightText } from "./support/clippedText";

describe("findClippedTightText", () => {
  it("signale un texte rogné en text-lg sans hauteur de ligne confortable", () => {
    const source = `<h1\n  className="line-clamp-2 text-lg font-medium">`;
    expect(findClippedTightText(source)).toEqual([{ line: 2, classes: "line-clamp-2 text-lg font-medium" }]);
  });

  it("signale truncate avec leading-snug, quelle que soit la taille", () => {
    expect(findClippedTightText(`<p className="truncate leading-snug">`)).toHaveLength(1);
  });

  it("accepte un texte rogné de grande taille avec leading-normal ou leading-relaxed", () => {
    expect(findClippedTightText(`<h1 className="line-clamp-2 text-lg leading-normal">`)).toEqual([]);
    expect(findClippedTightText(`<h1 className="line-clamp-2 text-2xl leading-relaxed">`)).toEqual([]);
  });

  it("accepte un texte rogné de petite taille, qui garde la hauteur de ligne 1,5 des tokens", () => {
    expect(findClippedTightText(`<p className="line-clamp-2 text-sm text-ink-2">`)).toEqual([]);
  });

  it("ignore un texte de grande taille qui n'est pas rogné", () => {
    expect(findClippedTightText(`<h1 className="font-display text-2xl leading-snug">`)).toEqual([]);
  });

  it("lit les gabarits, sans prendre une expression ${…} pour une classe", () => {
    const source = "<div className={`line-clamp-1 text-xl ${open ? \"leading-normal\" : \"\"}`}>";
    expect(findClippedTightText(source)).toHaveLength(1);
  });
});

/** Tous les .tsx de src/. */
function sourceFiles(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) return sourceFiles(full);
    return entry.name.endsWith(".tsx") ? [full] : [];
  });
}

describe("les textes rognés de src/", () => {
  it("ont une hauteur de ligne d'au moins 1,5, pour garder les points sous les lettres arabes", () => {
    const root = path.resolve(__dirname, "../../../src");
    const issues = sourceFiles(root).flatMap((file) =>
      findClippedTightText(readFileSync(file, "utf8")).map(
        (issue) => `${path.relative(root, file)}:${issue.line} « ${issue.classes} »`,
      ),
    );
    expect(issues).toEqual([]);
  });
});
