import { describe, expect, it } from "vitest";
import { compositeOver, contrastRatio, parseColor } from "./support/contrast";
import { readTokenScopes } from "./support/tokens";

describe("parseColor", () => {
  it("lit les codes hexadécimaux courts et longs", () => {
    expect(parseColor("#1B2550")).toEqual({ r: 27, g: 37, b: 80, a: 1 });
    expect(parseColor("#fff")).toEqual({ r: 255, g: 255, b: 255, a: 1 });
  });

  it("lit rgb() et rgba()", () => {
    expect(parseColor("rgba(17, 23, 51, 0.48)")).toEqual({ r: 17, g: 23, b: 51, a: 0.48 });
    expect(parseColor("rgb(0 0 0)")).toEqual({ r: 0, g: 0, b: 0, a: 1 });
  });

  it("refuse ce qui n'est pas une couleur", () => {
    expect(() => parseColor("var(--brand-blue)")).toThrow();
  });
});

describe("contrastRatio (WCAG 2.2)", () => {
  it("vaut 21 entre le noir et le blanc, 1 entre deux couleurs identiques", () => {
    expect(contrastRatio("#000000", "#FFFFFF")).toBeCloseTo(21, 5);
    expect(contrastRatio("#1F6FB2", "#1F6FB2")).toBeCloseTo(1, 5);
  });

  it("ne dépend pas de l'ordre", () => {
    expect(contrastRatio("#FFFFFF", "#767676")).toBeCloseTo(contrastRatio("#767676", "#FFFFFF"), 10);
  });

  it("retrouve les valeurs de référence (gris #767676 sur blanc : 4,54:1)", () => {
    expect(contrastRatio("#767676", "#FFFFFF")).toBeCloseTo(4.54, 2);
  });

  it("retrouve les ratios du brief", () => {
    expect(contrastRatio("#FBF8F1", "#1B2550")).toBeCloseTo(13.9, 1); // jasmin sur indigo
    expect(contrastRatio("#D9A441", "#1B2550")).toBeCloseTo(6.5, 1); // safran sur indigo
    expect(contrastRatio("#1F6FB2", "#FBF8F1")).toBeCloseTo(5.0, 1); // bleu sur jasmin
  });
});

describe("compositeOver", () => {
  it("pose une couleur translucide sur un fond opaque", () => {
    expect(compositeOver("rgba(0, 0, 0, 0.5)", "#FFFFFF")).toEqual({ r: 127.5, g: 127.5, b: 127.5, a: 1 });
  });

  it("laisse une couleur opaque telle quelle", () => {
    expect(compositeOver("#1B2550", "#FFFFFF")).toEqual({ r: 27, g: 37, b: 80, a: 1 });
  });
});

describe("readTokenScopes", () => {
  const css = `
:root,
[data-theme="light"] {
  --a: #111111; /* commentaire ; avec un point-virgule */
  --b: var(--a);
  --c: 4px;
}
[data-theme="dark"] {
  --a: #EEEEEE;
}
@media (prefers-color-scheme: dark) {
  :root:not([data-theme="light"]) {
    --a: #EEEEEE;
  }
}
[data-reader] {
  --r: #222222;
  --f: var(--r);
}
[data-reader][data-reader-theme="light"] {
  --r: #FAFAFA;
}
`;
  const scopes = readTokenScopes(css);

  it("lit les valeurs du thème clair et résout les var()", () => {
    expect(scopes.light["--a"]).toBe("#111111");
    expect(scopes.light["--b"]).toBe("#111111");
    expect(scopes.light["--c"]).toBe("4px");
  });

  it("superpose le thème sombre au thème clair, et une var() suit la valeur sombre", () => {
    expect(scopes.dark["--a"]).toBe("#EEEEEE");
    expect(scopes.dark["--b"]).toBe("#EEEEEE");
    expect(scopes.dark["--c"]).toBe("4px");
  });

  it("lit à part le bloc du sombre demandé par le système", () => {
    expect(scopes.systemDark).toEqual({ "--a": "#EEEEEE" });
    expect(scopes.darkOverrides).toEqual({ "--a": "#EEEEEE" });
  });

  it("superpose le lecteur, sombre par défaut, puis clair", () => {
    expect(scopes.reader["--r"]).toBe("#222222");
    expect(scopes.reader["--f"]).toBe("#222222");
    expect(scopes.readerLight["--r"]).toBe("#FAFAFA");
    expect(scopes.readerLight["--f"]).toBe("#FAFAFA");
  });
});
