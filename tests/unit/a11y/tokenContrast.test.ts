import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { contrastRatio } from "./support/contrast";
import { readTokenScopes, type TokenScope } from "./support/tokens";

/**
 * Contrastes des tokens (brief, « Exigences d'accessibilité », WCAG 2.2 AA) :
 * texte ≥ 4,5:1, composants et éléments graphiques ≥ 3:1, paroles ≥ 7:1.
 * Chaque couple vient d'un usage réel des composants (classes Tailwind entre parenthèses).
 */
const css = readFileSync(path.resolve(__dirname, "../../../src/app/design-tokens.css"), "utf8");
const scopes = readTokenScopes(css);

const TEXT = 4.5;
const GRAPHIC = 3;
const LYRICS = 7;

type Pair = [foreground: string, background: string, minimum: number, usage: string];

/** Un test par couple, avec le ratio mesuré dans le message d'échec. */
function checkPairs(scope: TokenScope, pairs: Pair[]) {
  it.each(pairs)("%s sur %s ≥ %s:1 (%s)", (fg, bg, minimum) => {
    const ratio = contrastRatio(scope[fg], scope[bg]);
    expect(ratio, `${fg} ${scope[fg]} sur ${bg} ${scope[bg]} : ${ratio.toFixed(2)}:1`).toBeGreaterThanOrEqual(minimum);
  });
}

const SURFACES = ["--color-bg-primary", "--color-bg-secondary", "--color-bg-tertiary"];

const APP_PAIRS: Pair[] = [
  ...SURFACES.flatMap((bg): Pair[] => [
    ["--color-text-primary", bg, TEXT, "texte (text-ink)"],
    ["--color-text-secondary", bg, TEXT, "texte secondaire (text-ink-2)"],
    ["--color-text-tertiary", bg, TEXT, "métadonnées, placeholders (text-ink-3)"],
    ["--color-text-link", bg, TEXT, "liens (text-link)"],
    ["--color-border-primary", bg, GRAPHIC, "bord des champs et boutons secondaires (border-line)"],
    ["--color-border-focus", bg, GRAPHIC, "anneau de focus"],
    ["--color-status-error", bg, TEXT, "erreurs en ligne (text-error)"],
    ["--color-status-success", bg, TEXT, "confirmations (text-success)"],
    ["--color-status-warning", bg, TEXT, "avertissements (text-warning)"],
  ]),
  ["--color-text-primary", "--color-bg-selected", TEXT, "ligne ou option choisie (bg-selected)"],
  ["--color-text-secondary", "--color-bg-selected", TEXT, "ligne choisie, texte secondaire"],
  ["--color-border-focus", "--color-bg-selected", GRAPHIC, "anneau de focus sur une ligne choisie"],
  ["--color-accent-secondary", "--color-bg-primary", GRAPHIC, "losange de l'onglet actif (bg-ornament)"],
  ["--color-accent-secondary", "--color-bg-secondary", GRAPHIC, "losange sur la barre d'onglets (bg-card)"],
  ["--color-accent-primary", "--color-bg-primary", GRAPHIC, "bouton primaire sur la page"],
  ["--color-on-accent", "--color-accent-primary", TEXT, "bouton primaire (text-accent-ink)"],
  ["--color-on-accent", "--color-accent-primary-hover", TEXT, "bouton primaire survolé"],
  ["--color-on-accent", "--color-accent-primary-active", TEXT, "bouton primaire enfoncé"],
  ["--color-text-inverse", "--color-bg-inverse", TEXT, "toast, option choisie (bg-inverse)"],
  ["--color-bg-primary", "--color-status-error", TEXT, "bouton de suppression (bg-error text-page)"],
  ["--color-status-success", "--color-status-success-bg", TEXT, "pastille Acceptée"],
  ["--color-status-warning", "--color-status-warning-bg", TEXT, "pastille En attente"],
  ["--color-status-error", "--color-status-error-bg", TEXT, "pastille Refusée, résumé d'erreurs"],
  ["--color-status-info", "--color-status-info-bg", TEXT, "pastille automatique"],
];

const READER_PAIRS: Pair[] = [
  ["--reader-text", "--reader-bg", LYRICS, "paroles"],
  ["--reader-translit", "--reader-bg", LYRICS, "ligne latine des paroles"],
  ["--reader-text-secondary", "--reader-bg", TEXT, "sous-titre, explications"],
  ["--reader-accent-text", "--reader-bg", TEXT, "position « 3 / 12 »"],
  ["--reader-accent", "--reader-bg", GRAPHIC, "losange et éléments graphiques"],
  ["--reader-control-text", "--reader-control-bg", TEXT, "boutons du lecteur, note, pastilles"],
  ["--reader-control-text", "--reader-control-bg-pressed", TEXT, "bouton enfoncé ou ouvert"],
  ["--reader-bg", "--reader-control-text", TEXT, "bouton plein, mode d'affichage choisi"],
  ["--reader-focus", "--reader-bg", GRAPHIC, "anneau de focus"],
  ["--reader-focus", "--reader-control-bg", GRAPHIC, "anneau de focus autour d'un bouton"],
];

describe("contrastes des tokens : app en clair", () => checkPairs(scopes.light, APP_PAIRS));
describe("contrastes des tokens : app en sombre", () => checkPairs(scopes.dark, APP_PAIRS));
describe("contrastes des tokens : lecteur sombre (défaut)", () => checkPairs(scopes.reader, READER_PAIRS));
describe("contrastes des tokens : lecteur clair", () => checkPairs(scopes.readerLight, READER_PAIRS));

describe("contrastes des tokens : paroles de la fiche chanson ([data-lyrics=page])", () => {
  // Les paroles prennent la couleur du texte de la page ; la ligne latine prend --color-text-secondary.
  for (const [name, scope] of [["clair", scopes.light], ["sombre", scopes.dark]] as const) {
    it(`paroles et ligne latine ≥ 7:1 sur la page, en ${name}`, () => {
      expect(contrastRatio(scope["--color-text-primary"], scope["--color-bg-primary"])).toBeGreaterThanOrEqual(LYRICS);
      expect(contrastRatio(scope["--color-text-secondary"], scope["--color-bg-primary"])).toBeGreaterThanOrEqual(LYRICS);
    });
  }
});

describe("cohérence des tokens", () => {
  it("le sombre demandé par le système redit exactement [data-theme=dark]", () => {
    expect(scopes.systemDark).toEqual(scopes.darkOverrides);
  });

  it("dans le lecteur, l'anneau de focus par défaut prend la couleur de focus du lecteur", () => {
    // Un élément du lecteur sans classe focus-visible:outline-reader-focus (zone des paroles, qui défile)
    // garde l'anneau global : il doit être safran sur le fond indigo, bleu sur le fond jasmin.
    expect(scopes.reader["--color-border-focus"]).toBe(scopes.reader["--reader-focus"]);
    expect(scopes.readerLight["--color-border-focus"]).toBe(scopes.readerLight["--reader-focus"]);
  });
});
