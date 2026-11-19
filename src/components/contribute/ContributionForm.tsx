"use client";

import { Plus, Send, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { startTransition, useActionState, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { submitProposal, type ContributeState } from "@/app/actions/contribute";
import { Checkbox } from "@/components/form/Checkbox";
import { FieldGroup } from "@/components/form/Field";
import { FormErrorSummary, type ErrorSummaryItem } from "@/components/form/FormErrorSummary";
import { LyricsTextarea } from "@/components/form/LyricsTextarea";
import { Select } from "@/components/form/Select";
import { TextField } from "@/components/form/TextField";
import type { KnownArtist } from "@/lib/contribution/artists";
import type { ContributionFormValues } from "@/lib/contribution/correction";
import { contributeHref } from "@/lib/contribution/routes";
import { ARTISTS_MAX, type ProposalField } from "@/lib/contribution/validate";
import { DIALECTS } from "@/types/catalog";
import { ArtistInput } from "./ArtistInput";

/** Identifiants des champs, cibles des liens du récapitulatif des erreurs. */
const FIELD_IDS: Record<ProposalField, string | undefined> = {
  form: undefined,
  title: "champ-titre-ar",
  titleAr: "champ-titre-ar",
  titleLatin: "champ-titre-latin",
  artists: "champ-artiste-0",
  lyrics: "champ-paroles",
  dialect: "champ-dialecte",
  translit: "champ-translit",
  rights: "champ-droits",
};
/** Ordre du formulaire, pour lister les erreurs de haut en bas. */
const FIELD_ORDER = Object.keys(FIELD_IDS) as ProposalField[];
const INITIAL_STATE: ContributeState = { errors: {}, attempt: 0 };
/** Délai après la dernière frappe avant de chercher les chansons proches. */
const SIMILAR_DEBOUNCE_MS = 600;

type ArtistRow = { key: number; value: string };

/**
 * Formulaire de /contribuer (ajout, `songId` nul) et de /contribuer/[songId] (correction pré-remplie).
 * Champs contrôlés : la saisie survit à un envoi refusé, et les erreurs s'affichent en ligne, avec un
 * récapitulatif en tête qui reçoit le focus.
 *
 * Ajout : le formulaire recopie titres et artistes dans l'adresse (?titre=&artiste=) pendant la
 * saisie ; la page rend alors côté serveur l'encadré « existe peut-être déjà », reçu ici dans `similar`.
 */
export function ContributionForm({
  songId,
  initial,
  artists,
  similar,
}: {
  songId: string | null;
  initial: ContributionFormValues;
  artists: readonly KnownArtist[];
  similar?: ReactNode;
}) {
  const t = useTranslations("contribute");
  const tDialects = useTranslations("dialects");
  const router = useRouter();
  const action = useMemo(() => submitProposal.bind(null, songId), [songId]);
  const [state, formAction, pending] = useActionState(action, INITIAL_STATE);
  const { errors } = state;

  const [titleAr, setTitleAr] = useState(initial.titleAr);
  const [titleLatin, setTitleLatin] = useState(initial.titleLatin);
  const [artistRows, setArtistRows] = useState<ArtistRow[]>(() =>
    (initial.artists.length > 0 ? initial.artists : [""]).map((value, key) => ({ key, value })),
  );
  const nextKey = useRef(artistRows.length);
  const [lyrics, setLyrics] = useState(initial.lyrics);
  const [dialect, setDialect] = useState(initial.dialect);
  const [translit, setTranslit] = useState(initial.translit);
  const [showTranslit, setShowTranslit] = useState(initial.translit !== "");
  const [rights, setRights] = useState(false);
  /** Champ à focaliser après le prochain rendu (ligne d'artiste ajoutée ou retirée, translittération ouverte). */
  const focusAfterRender = useRef<string | null>(null);
  const summaryRef = useRef<HTMLDivElement>(null);

  const summaryItems: ErrorSummaryItem[] = FIELD_ORDER.flatMap((field) => {
    const message = errors[field];
    return message ? [{ fieldId: FIELD_IDS[field], message }] : [];
  });

  // Après chaque envoi refusé, le focus va au récapitulatif (lu par le lecteur d'écran).
  useEffect(() => {
    if (state.attempt > 0) summaryRef.current?.focus();
  }, [state]);

  useEffect(() => {
    if (!focusAfterRender.current) return;
    document.getElementById(focusAfterRender.current)?.focus();
    focusAfterRender.current = null;
  });

  // Ajout : l'adresse suit les titres et artistes saisis, ce qui met à jour l'encadré des chansons proches.
  useEffect(() => {
    if (songId) return;
    const href = contributeHref({ titleAr, titleLatin, artists: artistRows.map((row) => row.value) });
    const timer = setTimeout(() => {
      if (href !== `${window.location.pathname}${window.location.search}`) router.replace(href, { scroll: false });
    }, SIMILAR_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [songId, titleAr, titleLatin, artistRows, router]);

  const setArtist = (index: number, value: string) =>
    setArtistRows((rows) => rows.map((row, i) => (i === index ? { ...row, value } : row)));
  const addArtist = () => {
    setArtistRows((rows) => [...rows, { key: nextKey.current++, value: "" }]);
    focusAfterRender.current = `champ-artiste-${artistRows.length}`;
  };
  const removeArtist = (index: number) => {
    setArtistRows((rows) => rows.filter((_, i) => i !== index));
    focusAfterRender.current = `champ-artiste-${Math.max(0, index - 1)}`;
  };

  return (
    <form
      action={formAction}
      // Envoi à la main : avec `action` seul, React 19 réinitialise le formulaire après l'envoi, et la
      // liste des dialectes et la case des droits reviendraient à vide alors que l'état les garde.
      // `action` reste pour l'envoi sans JavaScript.
      onSubmit={(e) => {
        e.preventDefault();
        const data = new FormData(e.currentTarget);
        startTransition(() => formAction(data));
      }}
      noValidate
      className="flex flex-col gap-7"
    >
      {summaryItems.length > 0 ? (
        <FormErrorSummary
          ref={summaryRef}
          title={t("errorSummary", { count: summaryItems.length, n: String(summaryItems.length) })}
          items={summaryItems}
        />
      ) : null}

      <FieldGroup legend={t("titles.legend")} hint={t("titles.hint")} error={errors.title} id="champ-titres">
        <TextField
          id="champ-titre-ar"
          name="titleAr"
          label={t("titles.ar")}
          error={errors.titleAr}
          dir="auto"
          lang="ar"
          autoComplete="off"
          spellCheck={false}
          value={titleAr}
          onChange={(e) => setTitleAr(e.target.value)}
        />
        <TextField
          id="champ-titre-latin"
          name="titleLatin"
          label={t("titles.latin")}
          error={errors.titleLatin}
          dir="auto"
          autoComplete="off"
          spellCheck={false}
          value={titleLatin}
          onChange={(e) => setTitleLatin(e.target.value)}
        />
      </FieldGroup>

      <FieldGroup legend={t("artists.legend")} hint={t("artists.hint")} error={errors.artists} id="champ-artistes">
        <ul className="flex flex-col gap-2">
          {artistRows.map((row, i) => (
            <li key={row.key} className="flex items-start gap-2">
              <ArtistInput
                id={`champ-artiste-${i}`}
                name="artist"
                value={row.value}
                onChange={(value) => setArtist(i, value)}
                artists={artists}
                label={t("artists.label", { n: String(i + 1) })}
                listLabel={t("artists.suggestions")}
                invalid={Boolean(errors.artists)}
              />
              {artistRows.length > 1 ? (
                <button
                  type="button"
                  onClick={() => removeArtist(i)}
                  aria-label={
                    row.value.trim()
                      ? t("artists.remove", { name: row.value.trim() })
                      : t("artists.removeUnnamed", { n: String(i + 1) })
                  }
                  className="inline-flex size-12 shrink-0 items-center justify-center rounded-md text-ink-2 hover:bg-well hover:text-ink"
                >
                  <X aria-hidden="true" className="size-5" />
                </button>
              ) : null}
            </li>
          ))}
        </ul>
        {artistRows.length < ARTISTS_MAX ? (
          <button
            type="button"
            onClick={addArtist}
            className="-mx-2 inline-flex min-h-11 items-center gap-2 self-start rounded-md px-2 font-medium text-link hover:bg-well"
          >
            <Plus aria-hidden="true" className="size-5" />
            {t("artists.add")}
          </button>
        ) : null}
      </FieldGroup>

      {/* Vide, la zone annule l'espace qui la précède : seul l'encadré, quand il apparaît, prend de la place. */}
      {songId ? null : (
        <div aria-live="polite" className="empty:-mt-7">
          {similar}
        </div>
      )}

      <LyricsTextarea
        id="champ-paroles"
        name="lyrics"
        label={t("lyrics.label")}
        hint={t("lyrics.hint")}
        error={errors.lyrics}
        value={lyrics}
        onChange={(e) => setLyrics(e.target.value)}
      />

      <Select
        id="champ-dialecte"
        name="dialect"
        label={t("dialect.label")}
        error={errors.dialect}
        placeholder={t("dialect.placeholder")}
        options={DIALECTS.map((d) => ({ value: d, label: tDialects(d) }))}
        value={dialect}
        onChange={(e) => setDialect(e.target.value)}
      />

      {showTranslit ? (
        <LyricsTextarea
          id="champ-translit"
          name="translit"
          script="latin"
          rows={10}
          label={t("translit.label")}
          hint={t("translit.hint")}
          error={errors.translit}
          value={translit}
          onChange={(e) => setTranslit(e.target.value)}
        />
      ) : (
        <div className="flex flex-col gap-1">
          <button
            type="button"
            onClick={() => {
              setShowTranslit(true);
              focusAfterRender.current = "champ-translit";
            }}
            className="-mx-2 inline-flex min-h-11 items-center gap-2 self-start rounded-md px-2 font-medium text-link hover:bg-well"
          >
            <Plus aria-hidden="true" className="size-5" />
            {t("translit.add")}
          </button>
          <p className="text-sm text-ink-2">{t("translit.addHint")}</p>
        </div>
      )}

      <Checkbox
        id="champ-droits"
        name="rights"
        label={t("rights")}
        error={errors.rights}
        checked={rights}
        onChange={(e) => setRights(e.target.checked)}
      />

      <div className="flex flex-col gap-3">
        <button
          type="submit"
          disabled={pending}
          className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-md bg-accent px-5 font-medium text-accent-ink transition-colors duration-(--duration-fast) hover:bg-accent-hover disabled:cursor-wait disabled:opacity-70"
        >
          <Send aria-hidden="true" className="size-5 rtl:-scale-x-100" />
          {pending ? t("submitting") : t("submit")}
        </button>
        <p className="text-center text-sm text-ink-2">{t("afterSubmit")}</p>
      </div>
    </form>
  );
}
