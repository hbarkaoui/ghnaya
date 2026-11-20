import { ChevronDown } from "lucide-react";
import { Fragment, type ReactNode } from "react";
import { getTranslations } from "next-intl/server";
import { diffLines, diffStats, pairDiffRows, segmentDiff, type DiffLine, type DiffSegment } from "@/lib/moderation/diff";

/** Écriture des lignes : paroles arabes (de droite à gauche, Noto Naskh) ou translittération latine. */
const SCRIPTS = {
  arabic: { dir: "rtl", lang: "ar", font: "font-lyrics text-lg leading-loose" },
  latin: { dir: "ltr", lang: undefined, font: "font-translit leading-relaxed" },
} as const;
type Script = keyof typeof SCRIPTS;

const LINE_STYLES = {
  same: { row: "", sign: "" },
  added: { row: "bg-success-soft text-ink", sign: "+" },
  removed: { row: "bg-error-soft text-ink", sign: "−" },
} as const;

type Labels = { added: string; removed: string; empty: string };

/**
 * Vue des différences de la modération (brief, « Vue des différences ») : les paroles ligne par ligne.
 * Une ligne ajoutée porte « + » sur fond vert, une ligne retirée « − » sur fond rouge, et chacune est
 * annoncée par un libellé (jamais la couleur seule). Les longues suites de lignes identiques sont
 * repliées dans un `<details>`. Chaque ligne porte `lang` et `dir` ; les libellés restent dans la langue
 * de l'interface.
 *  - En dessous de 1024 px : une colonne, les lignes retirées puis les lignes ajoutées, à leur place.
 *  - À partir de 1024 px : deux colonnes, avant / après (dans le sens de l'interface : « Avant » à droite
 *    en arabe), qui sortent de la colonne de 640 px pour occuper jusqu'à 1024 px (`breakout-wide`).
 * Les deux rendus sont dans la page, mais un seul est affiché, donc un seul est lu par un lecteur d'écran.
 */
export async function DiffView({
  before,
  after,
  script = "arabic",
  unchangedLabel,
}: {
  before: string;
  after: string;
  script?: Script;
  /** Message quand rien n'a changé (« Paroles inchangées. »). */
  unchangedLabel: string;
}) {
  const [t, tSides] = await Promise.all([
    getTranslations("moderation.diff"),
    getTranslations("moderation.proposal"),
  ]);
  const lines = diffLines(before, after);
  const { added, removed } = diffStats(lines);

  if (added === 0 && removed === 0) return <p className="text-ink-2">{unchangedLabel}</p>;
  const labels: Labels = { added: t("addedLine"), removed: t("removedLine"), empty: t("emptyLine") };
  const segments = segmentDiff(lines);
  const showHidden = (n: number) => t("showHidden", { count: n, n: String(n) });

  return (
    <div>
      <p className="flex flex-wrap gap-x-4 gap-y-1 text-sm font-medium">
        {added > 0 ? (
          <span className="text-success">
            <span aria-hidden="true">+ </span>
            {t("added", { count: added, n: String(added) })}
          </span>
        ) : null}
        {removed > 0 ? (
          <span className="text-error">
            <span aria-hidden="true">− </span>
            {t("removed", { count: removed, n: String(removed) })}
          </span>
        ) : null}
      </p>
      <div className="mt-3 overflow-hidden rounded-lg border border-line-subtle bg-card py-2 lg:hidden">
        <Segments segments={segments} showHidden={showHidden} render={(lines) => <Lines lines={lines} script={script} labels={labels} />} />
      </div>
      <div className="mt-3 hidden overflow-hidden rounded-lg border border-line-subtle bg-card lg:block lg:breakout-wide">
        {/* Les en-têtes sont visuels : chaque ligne modifiée est déjà annoncée « retirée » ou « ajoutée ». */}
        <div aria-hidden="true" className="grid grid-cols-2 border-b border-line-subtle bg-well text-sm font-medium">
          <p className="border-e border-line-subtle px-3 py-2">
            <span className="text-error">−</span> {tSides("before")}
          </p>
          <p className="px-3 py-2">
            <span className="text-success">+</span> {tSides("after")}
          </p>
        </div>
        <Segments segments={segments} showHidden={showHidden} render={(lines) => <Rows lines={lines} script={script} labels={labels} />} />
      </div>
    </div>
  );
}

/** Les parties du diff : visibles telles quelles, ou repliées dans un `<details>` (« Afficher les 4 lignes identiques »). */
function Segments({
  segments,
  showHidden,
  render,
}: {
  segments: DiffSegment[];
  showHidden: (n: number) => string;
  render: (lines: DiffLine[]) => ReactNode;
}) {
  return segments.map((segment, i) =>
    segment.hidden ? (
      <details key={i} className="group border-y border-dashed border-line-subtle">
        <summary className="flex min-h-11 cursor-pointer list-none items-center gap-2 px-3 text-sm font-medium text-link hover:bg-well [&::-webkit-details-marker]:hidden">
          <ChevronDown aria-hidden="true" className="size-4 transition-transform group-open:rotate-180" />
          {showHidden(segment.lines.length)}
        </summary>
        {render(segment.lines)}
      </details>
    ) : (
      <Fragment key={i}>{render(segment.lines)}</Fragment>
    ),
  );
}

/** Une colonne : chaque ligne du diff, dans l'ordre. */
function Lines({ lines, script, labels }: { lines: DiffLine[]; script: Script; labels: Labels }) {
  const { dir, font } = SCRIPTS[script];
  return (
    <ul className={font}>
      {lines.map((line, i) => (
        // Le sens d'écriture est posé sur toute la ligne : le signe se place à son début, à droite pour l'arabe.
        <li key={i} dir={dir} className={`flex gap-2 px-3 ${LINE_STYLES[line.kind].row}`}>
          <LineBody line={line} script={script} labels={labels} />
        </li>
      ))}
    </ul>
  );
}

/**
 * Deux colonnes : une rangée par ligne, avant d'un côté et après de l'autre (`pairDiffRows`). Une case
 * vide, en face d'une ligne retirée ou ajoutée sans vis-à-vis, est grisée. Le côté « après » d'une ligne
 * identique est masqué aux lecteurs d'écran, qui lisent chaque ligne inchangée une seule fois.
 */
function Rows({ lines, script, labels }: { lines: DiffLine[]; script: Script; labels: Labels }) {
  const { dir, font } = SCRIPTS[script];
  const cell = (line: DiffLine | null, side: "before" | "after") => {
    // Le filet entre les colonnes suit le sens de l'interface : il est posé sur la case, et le sens
    // d'écriture des paroles (dir) sur son contenu seulement.
    const divider = side === "before" ? "border-e border-line-subtle" : "";
    if (!line) return <div aria-hidden="true" className={`bg-well ${divider}`} />;
    return (
      <div
        aria-hidden={side === "after" && line.kind === "same" ? true : undefined}
        className={`min-w-0 ${LINE_STYLES[line.kind].row} ${divider}`}
      >
        <div dir={dir} className="flex gap-2 px-3">
          <LineBody line={line} script={script} labels={labels} />
        </div>
      </div>
    );
  };
  return (
    <ul className={font}>
      {pairDiffRows(lines).map((row, i) => (
        <li key={i} className="grid grid-cols-2">
          {cell(row.before, "before")}
          {cell(row.after, "after")}
        </li>
      ))}
    </ul>
  );
}

/** Le signe (« + », « − ») et le texte d'une ligne, avec son libellé pour les lecteurs d'écran. */
function LineBody({ line, script, labels }: { line: DiffLine; script: Script; labels: Labels }) {
  const { dir, lang } = SCRIPTS[script];
  const Mark = line.kind === "added" ? "ins" : line.kind === "removed" ? "del" : "span";
  return (
    <>
      <span aria-hidden="true" className="w-3 shrink-0 text-center font-sans font-medium">
        {LINE_STYLES[line.kind].sign}
      </span>
      <Mark className="min-w-0 flex-1 no-underline">
        {line.kind !== "same" ? <span className="sr-only">{labels[line.kind]} </span> : null}
        {line.text === "" ? (
          line.kind === "same" ? (
            <span aria-hidden="true">&nbsp;</span>
          ) : (
            <span className="font-sans text-sm text-ink-2 italic">{labels.empty}</span>
          )
        ) : (
          <span dir={dir} lang={lang} className="block">
            {line.text}
          </span>
        )}
      </Mark>
    </>
  );
}

/**
 * Paroles d'un ajout, sans version précédente : affichées telles quelles plutôt qu'en lignes
 * « ajoutées », pour que le modérateur les lise comme dans la fiche chanson.
 */
export function LyricsBlock({ text, script = "arabic" }: { text: string; script?: Script }) {
  const { dir, lang, font } = SCRIPTS[script];
  return (
    <div dir={dir} lang={lang} className={`rounded-lg border border-line-subtle bg-card px-4 py-3 whitespace-pre-line ${font}`}>
      {text}
    </div>
  );
}
