import { ChevronDown } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { diffLines, diffStats, segmentDiff, type DiffLine } from "@/lib/moderation/diff";

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

/**
 * Vue des différences de la modération (brief, « Vue des différences ») : les paroles ligne par ligne,
 * sur une colonne en mobile. Une ligne ajoutée porte « + » sur fond vert, une ligne retirée « − » sur
 * fond rouge, et chacune est annoncée par un libellé (jamais la couleur seule). Les longues suites de
 * lignes identiques sont repliées dans un `<details>`. Chaque ligne porte `lang` et `dir` ; les
 * libellés restent dans la langue de l'interface. La tâche 19 passera la vue sur deux colonnes
 * (avant / après) à partir de 1024 px.
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
  const t = await getTranslations("moderation.diff");
  const lines = diffLines(before, after);
  const { added, removed } = diffStats(lines);

  if (added === 0 && removed === 0) return <p className="text-ink-2">{unchangedLabel}</p>;
  const labels = { added: t("addedLine"), removed: t("removedLine"), empty: t("emptyLine") };

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
      <div className="mt-3 overflow-hidden rounded-lg border border-line-subtle bg-card py-2">
        {segmentDiff(lines).map((segment, i) =>
          segment.hidden ? (
            <details key={i} className="group border-y border-dashed border-line-subtle">
              <summary className="flex min-h-11 cursor-pointer list-none items-center gap-2 px-3 text-sm font-medium text-link hover:bg-well [&::-webkit-details-marker]:hidden">
                <ChevronDown aria-hidden="true" className="size-4 transition-transform group-open:rotate-180" />
                {t("showHidden", { count: segment.lines.length, n: String(segment.lines.length) })}
              </summary>
              <Lines lines={segment.lines} script={script} labels={labels} />
            </details>
          ) : (
            <Lines key={i} lines={segment.lines} script={script} labels={labels} />
          ),
        )}
      </div>
    </div>
  );
}

function Lines({
  lines,
  script,
  labels,
}: {
  lines: DiffLine[];
  script: Script;
  labels: { added: string; removed: string; empty: string };
}) {
  const { dir, lang, font } = SCRIPTS[script];
  return (
    <ul className={font}>
      {lines.map((line, i) => {
        const { row, sign } = LINE_STYLES[line.kind];
        const Mark = line.kind === "added" ? "ins" : line.kind === "removed" ? "del" : "span";
        return (
          // Le sens d'écriture est posé sur toute la ligne : le signe se place à son début, à droite pour l'arabe.
          <li key={i} dir={dir} className={`flex gap-2 px-3 ${row}`}>
            <span aria-hidden="true" className="w-3 shrink-0 text-center font-sans font-medium">
              {sign}
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
          </li>
        );
      })}
    </ul>
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
