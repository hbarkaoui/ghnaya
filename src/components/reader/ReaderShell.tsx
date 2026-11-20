"use client";

import {
  AArrowDown,
  AArrowUp,
  ChevronLeft,
  ChevronRight,
  Languages,
  MessageSquareText,
  Moon,
  RotateCcw,
  Sun,
  X,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { useCallback, useEffect, useRef, useState } from "react";
import { LogoSymbol } from "@/components/brand/Logo";
import { LyricsView } from "@/components/lyrics/LyricsView";
import { TranslitStatus } from "@/components/lyrics/TranslitStatus";
import { TranslitToggle } from "@/components/lyrics/TranslitToggle";
import { useTranslit } from "@/components/lyrics/useTranslit";
import { Bidi } from "@/components/ui/Bidi";
import { isolate } from "@/lib/text/isolate";
import { scriptAttrs } from "@/lib/text/scriptAttrs";
import { useLocalStorage } from "@/lib/useLocalStorage";
import type { ReaderEntry } from "@/types/catalog";
import { useReaderPrefs } from "./useReaderPrefs";
import { useSwipe } from "./useSwipe";
import { useWakeLock } from "./useWakeLock";

type Props = {
  entries: ReaderEntry[];
  /** Position de départ, numérotée à partir de 1. */
  initialPosition: number;
  /** Page à ouvrir à la fermeture quand il n'y a pas d'historique (lien ouvert directement). */
  fallbackHref: string;
} & (
  | {
      /** Playlist lue : précédent / suivant, URL qui suit la position, écran de fin. */
      playlist: { id: string; name: string };
    }
  | {
      /** Chanson seule (mode séance depuis la fiche) : 1 / 1, sans précédent / suivant ni écran de fin. */
      playlist?: undefined;
      /** Sous le titre, après la position : les artistes de la chanson. */
      subtitle: string;
    }
);

/**
 * Bouton du lecteur : 48 px fixes (--size-touch-reader), icône en 24 px fixes (attributs de lucide). Quand le
 * système agrandit le texte, les contrôles gardent leur taille et tiennent toujours sur une ligne.
 */
const CONTROL =
  "inline-flex size-(--size-touch-reader) shrink-0 items-center justify-center rounded-md bg-reader-control text-reader-control-ink transition-colors duration-(--duration-fast) hover:bg-reader-control-pressed active:bg-reader-control-pressed disabled:opacity-40 focus-visible:outline-reader-focus";

const HINT_KEY = "ghnaya.reader.wakeHintDismissed";

/**
 * Contrôles masqués ou affichés d'un toucher sur les paroles : fondu seul (--duration-normal,
 * --easing-default), sans déplacement, pour que les paroles ne bougent pas. Masqués, ils sortent aussitôt
 * de l'arbre d'accessibilité (inert, aria-hidden) : rien ne dépend de la fin du fondu.
 */
const CONTROLS_MOTION = "transition-opacity duration-(--duration-normal) ease-calm";

/**
 * Lecteur de séance plein écran : sombre par défaut, paroles en 28 px, navigation par glissement
 * (dans le sens de lecture) ou par boutons, écran maintenu allumé, préférences mémorisées.
 * Un toucher sur les paroles masque ou affiche les contrôles.
 * Sans `playlist`, il lit une chanson seule : position 1 / 1, ni navigation ni écran de fin.
 */
export function ReaderShell(props: Props) {
  const { entries, initialPosition, fallbackHref, playlist } = props;
  const single = !playlist;
  const playlistId = playlist?.id;
  const subtitle = playlist ? playlist.name : props.subtitle;

  const t = useTranslations("reader");
  const tLyrics = useTranslations("lyrics");
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
  const lyricsRef = useRef<HTMLDivElement>(null);

  const total = entries.length;
  const entry = entries[index];
  const title = entry.song.titleAr ?? entry.song.titleLatin ?? "";
  const position = String(index + 1);
  const translit = useTranslit(
    entries.map((e) => e.song),
    entry.song.id,
    prefs.mode !== "ar" && !ended,
  );

  const goTo = useCallback(
    (target: number) => {
      if (!playlistId || target < 0) return;
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
    // Ouvert directement : on remplace le lecteur, pour que « retour » n'y ramène pas.
    else router.replace(fallbackHref);
  }, [router, fallbackHref]);

  // Clavier (ordinateur) : les flèches suivent le sens de lecture, Échap ferme le lecteur.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.defaultPrevented || e.altKey || e.ctrlKey || e.metaKey) return;
      const forward = rtl ? "ArrowLeft" : "ArrowRight";
      const backward = rtl ? "ArrowRight" : "ArrowLeft";
      if (e.key === forward && !single) {
        e.preventDefault();
        next();
      } else if (e.key === backward && !single) {
        e.preventDefault();
        previous();
      } else if (e.key === "Escape") {
        close();
      } else if (e.key === "Tab") {
        // Contrôles masqués d'un toucher : la touche Tab les rend, sinon ils resteraient hors d'atteinte du clavier.
        setControlsVisible(true);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [rtl, single, next, previous, close]);

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
      // overflow-y-auto : en dernier recours, quand le texte agrandi rend l'en-tête et les contrôles plus hauts que
      // l'écran, le lecteur entier défile ; les contrôles du bas ne sortent jamais hors d'atteinte.
      className="fixed inset-0 z-(--z-reader) flex flex-col overflow-y-auto overscroll-contain bg-reader-bg text-reader-ink"
    >
      <header
        className={`shrink-0 px-2 pt-[calc(env(safe-area-inset-top)+0.5rem)] pb-2 ${CONTROLS_MOTION} ${hideWhenIdle}`}
        {...hiddenProps}
      >
        <div className="mx-auto flex max-w-reader items-center gap-2">
          <button type="button" onClick={close} aria-label={t("close")} className={CONTROL}>
            <X aria-hidden="true" />
          </button>
          {/* Titre et sous-titre sur deux lignes au plus, plutôt que tronqués sur une seule : ils restent lisibles
              à 320 px et quand le texte est agrandi. */}
          <div className="min-w-0 flex-1 text-center">
            <h1 {...scriptAttrs(title)} className="line-clamp-2 text-lg font-medium break-words">
              {title}
            </h1>
            <p className="line-clamp-2 text-sm text-reader-ink-2">
              <span className="font-medium text-reader-accent-text" dir="ltr">
                {t("position", { current: position, total: String(total) })}
              </span>
              {subtitle ? (
                <>
                  <span aria-hidden="true"> · </span>
                  <Bidi>{subtitle}</Bidi>
                </>
              ) : null}
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
              <MessageSquareText aria-hidden="true" />
            </button>
          ) : (
            <span aria-hidden="true" className="size-(--size-touch-reader) shrink-0" />
          )}
        </div>
        {entry.note && noteOpen && !ended ? (
          <p
            id="reader-note"
            className="mx-auto mt-2 max-w-reader rounded-md bg-reader-control px-3 py-2 text-sm text-reader-control-ink"
          >
            <span className="sr-only">{t("noteLabel")} : </span>
            <Bidi>{entry.note}</Bidi>
          </p>
        ) : null}
      </header>

      <div
        ref={lyricsRef}
        // Zone qui défile, atteignable au clavier dans tous les navigateurs (Safari ne le fait pas seul) :
        // ↑ / ↓, Espace et Page suivante font défiler les paroles ; ← / → restent pour changer de chanson.
        tabIndex={0}
        role="region"
        aria-label={tLyrics("title")}
        className="min-h-32 flex-1 touch-pan-y overflow-y-auto overscroll-contain px-6"
        {...swipe}
      >
        {/* Passage d'une chanson à l'autre : les nouvelles paroles (ou l'écran de fin) apparaissent en fondu
            (.reader-fade, 250 ms), sans glisser. Le titre et la position changent tout de suite. */}
        <div className="mx-auto max-w-reader py-6">
          {ended && playlist ? (
            <section className="reader-fade flex flex-col items-center gap-4 py-12 text-center">
              <LogoSymbol size={72} />
              <h2 className="font-display text-2xl font-semibold">{t("endTitle")}</h2>
              <p className="text-reader-ink-2">
                {t("endBody", { count: total, n: String(total), name: isolate(playlist.name) })}
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
              <TranslitStatus view={translit.view} status={translit.status} onRetry={translit.retry} tone="reader" />
              <LyricsView
                key={`${index}-${prefs.mode}`}
                lyrics={entry.song.lyrics}
                translit={translit.text}
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
          // À partir de 768 px, le message garde la largeur des paroles et des contrôles (720 px au plus).
          className="mx-3 mb-2 flex shrink-0 flex-wrap items-start gap-3 rounded-md bg-reader-control p-3 text-sm text-reader-control-ink md:mx-auto md:w-full md:max-w-reader"
        >
          {/* basis-48 + flex-wrap : texte agrandi, « Compris » passe sous le message au lieu de l'écraser. */}
          <p className="min-w-0 grow basis-48">{t("wakeHint")}</p>
          <button
            type="button"
            onClick={() => setHintDismissed("1")}
            className="min-h-12 shrink-0 rounded-md px-3 font-medium underline underline-offset-4 focus-visible:outline-reader-focus"
          >
            {t("wakeHintDismiss")}
          </button>
        </div>
      ) : null}

      <footer
        // Six boutons de 48 px fixes : marges et espaces en px (tokens --space-*), qui ne grandissent pas avec le
        // texte, et resserrés sous 352 px pour que la rangée tienne jusqu'à 320 px (WCAG 1.4.10).
        className={`shrink-0 px-(--space-1) pt-2 pb-[calc(env(safe-area-inset-bottom)+0.75rem)] min-[352px]:px-(--space-3) ${CONTROLS_MOTION} ${hideWhenIdle}`}
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
              className="mx-auto mb-2 max-w-reader"
            />
          </div>
        ) : null}
        <div
          role="group"
          aria-label={t("controls")}
          className={`mx-auto flex max-w-reader items-center gap-(--space-1) min-[352px]:gap-(--space-2) ${single ? "justify-center" : "justify-between"}`}
        >
          {single ? null : (
            <button
              type="button"
              onClick={previous}
              disabled={index === 0 && !ended}
              aria-label={t("previous")}
              className={CONTROL}
            >
              <ChevronLeft aria-hidden="true" size={28} className="rtl:-scale-x-100" />
            </button>
          )}
          <div className="flex items-center gap-(--space-1) min-[352px]:gap-(--space-2)">
            <button type="button" onClick={prefs.smaller} disabled={!prefs.canShrink} aria-label={t("smaller")} className={CONTROL}>
              <AArrowDown aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={() => setModeOpen((open) => !open)}
              aria-expanded={modeOpen}
              aria-controls="reader-mode"
              aria-label={tLyrics("modeLabel")}
              className={`${CONTROL} ${modeOpen ? "bg-reader-control-pressed" : ""}`}
            >
              <Languages aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={prefs.toggleTheme}
              aria-label={prefs.theme === "dark" ? t("themeToLight") : t("themeToDark")}
              className={CONTROL}
            >
              {prefs.theme === "dark" ? (
                <Sun aria-hidden="true" />
              ) : (
                <Moon aria-hidden="true" />
              )}
            </button>
            <button type="button" onClick={prefs.larger} disabled={!prefs.canGrow} aria-label={t("larger")} className={CONTROL}>
              <AArrowUp aria-hidden="true" />
            </button>
          </div>
          {single ? null : (
            <button type="button" onClick={next} disabled={ended} aria-label={t("next")} className={CONTROL}>
              <ChevronRight aria-hidden="true" size={28} className="rtl:-scale-x-100" />
            </button>
          )}
        </div>
      </footer>

      <p aria-live="polite" className="sr-only">
        {ended
          ? t("endTitle")
          : t.rich("announce", { current: position, total: String(total), title, song: (chunks) => <Bidi>{chunks}</Bidi> })}
      </p>
    </div>
  );
}
