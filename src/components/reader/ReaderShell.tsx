"use client";

import {
  AArrowDown,
  AArrowUp,
  Check,
  ChevronLeft,
  ChevronRight,
  Info,
  Languages,
  LoaderCircle,
  MessageSquareText,
  Moon,
  RotateCcw,
  RotateCw,
  Sun,
  X,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { useCallback, useEffect, useRef, useState } from "react";
import { requestTranslit } from "@/app/actions/translit";
import { LogoSymbol } from "@/components/brand/Logo";
import { LyricsView } from "@/components/lyrics/LyricsView";
import { Badge } from "@/components/ui/Badge";
import { useLocalStorage } from "@/lib/useLocalStorage";
import type { ReaderEntry } from "@/types/catalog";
import { TranslitToggle } from "./TranslitToggle";
import { useReaderPrefs } from "./useReaderPrefs";
import { useSwipe } from "./useSwipe";
import { useWakeLock } from "./useWakeLock";

/** Résultat connu de la translittération d'une chanson (absent = pas encore demandé). */
type TranslitState =
  | { kind: "ready"; text: string; status: "auto" | "reviewed" }
  | { kind: "failed" }
  | { kind: "limit" };

function initialTranslits(entries: ReaderEntry[]): Record<string, TranslitState> {
  const known: Record<string, TranslitState> = {};
  for (const { song } of entries) {
    if (song.lyricsTranslit && (song.translitStatus === "auto" || song.translitStatus === "reviewed")) {
      known[song.id] = { kind: "ready", text: song.lyricsTranslit, status: song.translitStatus };
    }
  }
  return known;
}

type Props = {
  playlistId: string;
  playlistName: string;
  entries: ReaderEntry[];
  /** Position de départ, numérotée à partir de 1. */
  initialPosition: number;
  /** Page à ouvrir à la fermeture quand il n'y a pas d'historique (lien ouvert directement). */
  fallbackHref: string;
};

const CONTROL =
  "inline-flex size-12 shrink-0 items-center justify-center rounded-md bg-reader-control text-reader-control-ink transition-colors duration-(--duration-fast) hover:bg-reader-control-pressed active:bg-reader-control-pressed disabled:opacity-40 focus-visible:outline-reader-focus";

const HINT_KEY = "ghnaya.reader.wakeHintDismissed";

/**
 * Lecteur de séance plein écran : sombre par défaut, paroles en 28 px, navigation par glissement
 * (dans le sens de lecture) ou par boutons, écran maintenu allumé, préférences mémorisées.
 * Un toucher sur les paroles masque ou affiche les contrôles.
 */
export function ReaderShell({ playlistId, playlistName, entries, initialPosition, fallbackHref }: Props) {
  const t = useTranslations("reader");
  const rtl = useLocale() === "ar";
  const router = useRouter();
  const prefs = useReaderPrefs();
  const wake = useWakeLock();
  const [hintDismissed, setHintDismissed] = useLocalStorage(HINT_KEY);

  const [index, setIndex] = useState(initialPosition - 1);
  const [ended, setEnded] = useState(false);
  const [controlsVisible, setControlsVisible] = useState(true);
  const [noteOpen, setNoteOpen] = useState(true);
  const [modeOpen, setModeOpen] = useState(false);
  const [translits, setTranslits] = useState(() => initialTranslits(entries));
  const inFlight = useRef(new Set<string>());
  const lyricsRef = useRef<HTMLDivElement>(null);

  const total = entries.length;
  const entry = entries[index];
  const title = entry.song.titleAr ?? entry.song.titleLatin ?? "";
  const position = String(index + 1);

  // Translittération de la chanson affichée. Sans résultat connu alors qu'un mode latin est demandé,
  // l'état « génération en cours » est dérivé : l'effet ci-dessous lance la demande.
  const songId = entry.song.id;
  const wantsTranslit = prefs.mode !== "ar" && !ended;
  // Une entrée peut être absente : on l'écrit explicitement (l'accès indexé est typé « toujours défini »).
  const translit = translits[songId] as TranslitState | undefined;
  const translitView = !wantsTranslit ? "off" : (translit?.kind ?? "generating");

  useEffect(() => {
    if (!wantsTranslit || translits[songId] || inFlight.current.has(songId)) return;
    inFlight.current.add(songId);
    requestTranslit(songId)
      .then((result) =>
        setTranslits((prev) => ({
          ...prev,
          [songId]: result.ok ? { kind: "ready", text: result.text, status: result.status } : { kind: result.reason },
        })),
      )
      .catch(() => setTranslits((prev) => ({ ...prev, [songId]: { kind: "failed" } })))
      .finally(() => inFlight.current.delete(songId));
  }, [wantsTranslit, translits, songId]);

  const retryTranslit = () =>
    setTranslits((prev) => {
      const next = { ...prev };
      delete next[songId];
      return next;
    });

  const goTo = useCallback(
    (target: number) => {
      if (target < 0) return;
      if (target >= total) {
        setEnded(true);
        return;
      }
      setEnded(false);
      setIndex(target);
      setNoteOpen(true);
      // L'URL suit la position (lien partageable) sans empiler l'historique : « retour » ramène à l'origine.
      window.history.replaceState(null, "", `/lecture/${playlistId}/${target + 1}`);
      lyricsRef.current?.scrollTo({ top: 0 });
    },
    [playlistId, total],
  );

  const next = useCallback(() => {
    if (!ended) goTo(index + 1);
  }, [ended, goTo, index]);

  const previous = useCallback(() => {
    if (ended) {
      setEnded(false);
      lyricsRef.current?.scrollTo({ top: 0 });
    } else {
      goTo(index - 1);
    }
  }, [ended, goTo, index]);

  const close = useCallback(() => {
    if (window.history.length > 1) router.back();
    else router.push(fallbackHref);
  }, [router, fallbackHref]);

  // Clavier (ordinateur) : les flèches suivent le sens de lecture, Échap ferme le lecteur.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.defaultPrevented || e.altKey || e.ctrlKey || e.metaKey) return;
      const forward = rtl ? "ArrowLeft" : "ArrowRight";
      const backward = rtl ? "ArrowRight" : "ArrowLeft";
      if (e.key === forward) {
        e.preventDefault();
        next();
      } else if (e.key === backward) {
        e.preventDefault();
        previous();
      } else if (e.key === "Escape") {
        close();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [rtl, next, previous, close]);

  const swipe = useSwipe({
    rtl,
    onNext: next,
    onPrevious: previous,
    onTap: () => setControlsVisible((visible) => !visible),
  });

  const hideWhenIdle = controlsVisible ? "" : "pointer-events-none opacity-0";
  const hiddenProps = controlsVisible ? {} : ({ inert: true, "aria-hidden": true } as const);
  const showHint = wake.needsHint && hintDismissed !== "1";

  return (
    <div
      data-reader
      data-reader-theme={prefs.theme}
      data-reader-size={prefs.size}
      className="fixed inset-0 z-(--z-reader) flex flex-col bg-reader-bg text-reader-ink"
    >
      <header
        className={`shrink-0 px-2 pt-[calc(env(safe-area-inset-top)+0.5rem)] pb-2 transition-opacity duration-(--duration-normal) ${hideWhenIdle}`}
        {...hiddenProps}
      >
        <div className="mx-auto flex max-w-reader items-center gap-2">
          <button type="button" onClick={close} aria-label={t("close")} className={CONTROL}>
            <X aria-hidden="true" className="size-6" />
          </button>
          <div className="min-w-0 flex-1 text-center">
            <h1 dir="auto" className="truncate text-lg font-medium">
              {title}
            </h1>
            <p className="truncate text-sm text-reader-ink-2">
              <span className="font-medium text-reader-accent-text" dir="ltr">
                {t("position", { current: position, total: String(total) })}
              </span>
              <span aria-hidden="true"> · </span>
              <span dir="auto">{playlistName}</span>
            </p>
          </div>
          {entry.note && !ended ? (
            <button
              type="button"
              onClick={() => setNoteOpen((open) => !open)}
              aria-expanded={noteOpen}
              aria-controls="reader-note"
              aria-label={noteOpen ? t("hideNote") : t("showNote")}
              className={CONTROL}
            >
              <MessageSquareText aria-hidden="true" className="size-6" />
            </button>
          ) : (
            <span aria-hidden="true" className="size-12 shrink-0" />
          )}
        </div>
        {entry.note && noteOpen && !ended ? (
          <p
            id="reader-note"
            className="mx-auto mt-2 max-w-reader rounded-md bg-reader-control px-3 py-2 text-sm text-reader-control-ink"
          >
            <span className="sr-only">{t("noteLabel")} : </span>
            <span dir="auto">{entry.note}</span>
          </p>
        ) : null}
      </header>

      <div
        ref={lyricsRef}
        className="min-h-0 flex-1 touch-pan-y overflow-y-auto overscroll-contain px-6"
        {...swipe}
      >
        <div className="mx-auto max-w-reader py-6">
          {ended ? (
            <section className="flex flex-col items-center gap-4 py-12 text-center">
              <LogoSymbol size={72} />
              <h2 className="font-display text-2xl font-semibold">{t("endTitle")}</h2>
              <p className="text-reader-ink-2">
                {t("endBody", { total: String(total), name: playlistName })}
              </p>
              <div className="mt-2 flex flex-wrap justify-center gap-3">
                <button
                  type="button"
                  onClick={() => goTo(0)}
                  className="inline-flex min-h-12 items-center gap-2 rounded-md bg-reader-control-ink px-5 font-medium text-reader-bg focus-visible:outline-reader-focus"
                >
                  <RotateCcw aria-hidden="true" className="size-5" />
                  {t("restart")}
                </button>
                <button
                  type="button"
                  onClick={close}
                  className="min-h-12 rounded-md border border-reader-divider px-5 font-medium focus-visible:outline-reader-focus"
                >
                  {t("close")}
                </button>
              </div>
            </section>
          ) : (
            <>
              {translitView === "generating" ? (
                <p role="status" className="mb-5">
                  <Badge tone="reader" icon={<LoaderCircle aria-hidden="true" className="size-4 animate-spin" />}>
                    {t("translit.generating")}
                  </Badge>
                </p>
              ) : null}
              {translit?.kind === "ready" && translitView !== "off" ? (
                <p className="mb-5">
                  <Badge
                    tone="reader"
                    icon={
                      translit.status === "auto" ? (
                        <Info aria-hidden="true" className="size-4" />
                      ) : (
                        <Check aria-hidden="true" className="size-4" />
                      )
                    }
                  >
                    {translit.status === "auto" ? t("translit.auto") : t("translit.reviewed")}
                  </Badge>
                </p>
              ) : null}
              {translitView === "failed" ? (
                <div role="alert" className="mb-5 rounded-md bg-reader-control p-3 text-sm text-reader-control-ink">
                  <p>{t("translit.failed")}</p>
                  <button
                    type="button"
                    onClick={retryTranslit}
                    className="mt-1 inline-flex min-h-11 items-center gap-2 rounded-md px-1 font-medium underline underline-offset-4 focus-visible:outline-reader-focus"
                  >
                    <RotateCw aria-hidden="true" className="size-4" />
                    {t("translit.retry")}
                  </button>
                </div>
              ) : null}
              {translitView === "limit" ? (
                <p role="status" className="mb-5 rounded-md bg-reader-control p-3 text-sm text-reader-control-ink">
                  {t("translit.limit")}
                </p>
              ) : null}
              <LyricsView
                key={`${entry.song.id}-${prefs.mode}`}
                lyrics={entry.song.lyrics}
                translit={translit?.kind === "ready" ? translit.text : null}
                mode={prefs.mode}
                className="reader-fade"
              />
            </>
          )}
        </div>
      </div>

      {showHint ? (
        <div
          role="status"
          className="mx-3 mb-2 flex items-start gap-3 rounded-md bg-reader-control p-3 text-sm text-reader-control-ink"
        >
          <p className="flex-1">{t("wakeHint")}</p>
          <button
            type="button"
            onClick={() => setHintDismissed("1")}
            className="min-h-11 shrink-0 rounded-md px-3 font-medium underline underline-offset-4 focus-visible:outline-reader-focus"
          >
            {t("wakeHintDismiss")}
          </button>
        </div>
      ) : null}

      <footer
        className={`shrink-0 px-3 pt-2 pb-[calc(env(safe-area-inset-bottom)+0.75rem)] transition-opacity duration-(--duration-normal) ${hideWhenIdle}`}
        {...hiddenProps}
      >
        {modeOpen ? (
          <div id="reader-mode">
            <TranslitToggle
              mode={prefs.mode}
              onChange={(mode) => {
                prefs.setMode(mode);
                setModeOpen(false);
              }}
            />
          </div>
        ) : null}
        <div role="group" aria-label={t("controls")} className="mx-auto flex max-w-reader items-center justify-between gap-2">
          <button
            type="button"
            onClick={previous}
            disabled={index === 0 && !ended}
            aria-label={t("previous")}
            className={CONTROL}
          >
            <ChevronLeft aria-hidden="true" className="size-7 rtl:-scale-x-100" />
          </button>
          <div className="flex items-center gap-2">
            <button type="button" onClick={prefs.smaller} disabled={!prefs.canShrink} aria-label={t("smaller")} className={CONTROL}>
              <AArrowDown aria-hidden="true" className="size-6" />
            </button>
            <button
              type="button"
              onClick={() => setModeOpen((open) => !open)}
              aria-expanded={modeOpen}
              aria-controls="reader-mode"
              aria-label={t("modeButton")}
              className={`${CONTROL} ${modeOpen ? "bg-reader-control-pressed" : ""}`}
            >
              <Languages aria-hidden="true" className="size-6" />
            </button>
            <button
              type="button"
              onClick={prefs.toggleTheme}
              aria-label={prefs.theme === "dark" ? t("themeToLight") : t("themeToDark")}
              className={CONTROL}
            >
              {prefs.theme === "dark" ? (
                <Sun aria-hidden="true" className="size-6" />
              ) : (
                <Moon aria-hidden="true" className="size-6" />
              )}
            </button>
            <button type="button" onClick={prefs.larger} disabled={!prefs.canGrow} aria-label={t("larger")} className={CONTROL}>
              <AArrowUp aria-hidden="true" className="size-6" />
            </button>
          </div>
          <button type="button" onClick={next} disabled={ended} aria-label={t("next")} className={CONTROL}>
            <ChevronRight aria-hidden="true" className="size-7 rtl:-scale-x-100" />
          </button>
        </div>
      </footer>

      <p aria-live="polite" className="sr-only">
        {ended ? t("endTitle") : t("announce", { current: position, total: String(total), title })}
      </p>
    </div>
  );
}
