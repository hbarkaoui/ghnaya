"use client";

import { X } from "lucide-react";
import { useEffect, useId, useRef, useState, type KeyboardEvent, type PointerEvent, type ReactNode } from "react";
import { createPortal } from "react-dom";

/** Durée de la sortie, alignée sur --duration-normal (250 ms) ; 0 si le mouvement est réduit. */
const EXIT_MS = 250;
/** Glissement vers le bas qui ferme la feuille : 96 px, ou le quart de sa hauteur si elle est plus petite. */
const DRAG_CLOSE_PX = 96;
const DRAG_CLOSE_RATIO = 0.25;
/** Un geste rapide (« lancer ») ferme aussi, même court. */
const FLICK_PX_PER_MS = 0.5;
const FLICK_MIN_PX = 24;

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

const prefersReducedMotion = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/**
 * Rend inerte tout ce qui est hors de la feuille (contenu, barre d'onglets), sauf les régions
 * d'annonce marquées `data-live-region` (toasts) : un toast affiché pendant que la feuille est ouverte
 * doit rester visible et annoncé.
 */
function makeOutsideInert(root: Element): () => void {
  const changed: Element[] = [];
  for (const element of Array.from(document.body.children)) {
    if (element === root || element.contains(root)) continue;
    if (element.hasAttribute("inert") || element.hasAttribute("data-live-region")) continue;
    element.setAttribute("inert", "");
    changed.push(element);
  }
  return () => changed.forEach((element) => element.removeAttribute("inert"));
}

type Props = {
  open: boolean;
  /** Demande de fermeture : bouton ✕, Échap, toucher sur le fond ou glissement vers le bas. */
  onClose: () => void;
  title: ReactNode;
  description?: ReactNode;
  /** Libellé du bouton ✕, dans la langue de l'interface. */
  closeLabel: string;
  /**
   * Élément qui reprend le focus à la fermeture. Par défaut, celui qui l'avait à l'ouverture ; à préciser
   * pour Safari, où un toucher sur un bouton ne lui donne pas le focus.
   */
  returnFocus?: HTMLElement | null;
  children: ReactNode;
};

/**
 * Feuille qui monte du bas de l'écran (IA, navigation secondaire), au-dessus de la barre d'onglets.
 *  - Fermeture : glissement vers le bas depuis la poignée ou le titre, Échap, toucher sur le fond, ✕.
 *  - Modale : le reste de la page est inerte et ne défile plus ; Tab et Maj+Tab tournent dans la feuille.
 *  - Focus : sur la feuille à l'ouverture (le titre est annoncé), rendu au déclencheur à la fermeture.
 *  - Mouvement : montée et descente en 250 ms avec --easing-default, coupées par prefers-reduced-motion.
 */
export function Sheet({ open, onClose, title, description, closeLabel, returnFocus, children }: Props) {
  // La feuille reste montée pendant sa sortie : `present` suit `open` à l'ouverture, et ne repasse à
  // false qu'une fois l'animation de fermeture finie.
  const [present, setPresent] = useState(open);
  if (open && !present) setPresent(true);
  const closing = present && !open;

  const rootRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const backdropRef = useRef<HTMLDivElement>(null);
  const drag = useRef<{ y: number; t: number; dy: number } | null>(null);
  const titleId = useId();
  const descriptionId = useId();

  useEffect(() => {
    if (!open) return;
    const root = rootRef.current;
    const panel = panelRef.current;
    if (!root || !panel) return;
    const trigger = returnFocus ?? (document.activeElement instanceof HTMLElement ? document.activeElement : null);
    const restoreInert = makeOutsideInert(root);
    const html = document.documentElement;
    const overflow = html.style.overflow;
    html.style.overflow = "hidden";
    panel.focus({ preventScroll: true });
    return () => {
      restoreInert();
      html.style.overflow = overflow;
      if (trigger?.isConnected) trigger.focus({ preventScroll: true });
    };
    // returnFocus est lu à l'ouverture seulement.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  useEffect(() => {
    if (!closing) return;
    const timer = window.setTimeout(() => setPresent(false), prefersReducedMotion() ? 0 : EXIT_MS);
    return () => window.clearTimeout(timer);
  }, [closing]);

  if (!present) return null;

  function onKeyDown(event: KeyboardEvent) {
    if (event.nativeEvent.isComposing) return;
    if (event.key === "Escape") {
      event.stopPropagation();
      onClose();
      return;
    }
    const panel = panelRef.current;
    if (event.key !== "Tab" || !panel) return;
    const focusable = Array.from(panel.querySelectorAll<HTMLElement>(FOCUSABLE));
    if (focusable.length === 0) {
      event.preventDefault();
      return;
    }
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    const active = document.activeElement;
    if (event.shiftKey && (active === first || active === panel)) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && active === last) {
      event.preventDefault();
      first.focus();
    }
  }

  // Glissement vers le bas, depuis la poignée et le titre (pas depuis la liste, qui défile).
  function onPointerDown(event: PointerEvent<HTMLDivElement>) {
    if (event.button !== 0 || closing) return;
    if (event.target instanceof Element && event.target.closest("button, a, input, select, textarea")) return;
    drag.current = { y: event.clientY, t: performance.now(), dy: 0 };
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function onPointerMove(event: PointerEvent<HTMLDivElement>) {
    const state = drag.current;
    const panel = panelRef.current;
    if (!state || !panel) return;
    state.dy = Math.max(0, event.clientY - state.y);
    panel.style.transition = "none";
    panel.style.translate = `0 ${state.dy}px`;
    const backdrop = backdropRef.current;
    if (backdrop) {
      backdrop.style.transition = "none";
      backdrop.style.opacity = String(1 - Math.min(1, state.dy / panel.offsetHeight));
    }
  }

  function endDrag(cancelled: boolean) {
    const state = drag.current;
    drag.current = null;
    const panel = panelRef.current;
    if (!state || !panel) return;
    const velocity = state.dy / Math.max(1, performance.now() - state.t);
    const farEnough = state.dy > Math.min(DRAG_CLOSE_PX, panel.offsetHeight * DRAG_CLOSE_RATIO);
    const flicked = velocity > FLICK_PX_PER_MS && state.dy > FLICK_MIN_PX;
    // On rend la main aux classes : la feuille repart de sa position actuelle, vers le haut ou vers le bas.
    panel.style.transition = "";
    panel.style.translate = "";
    if (backdropRef.current) {
      backdropRef.current.style.transition = "";
      backdropRef.current.style.opacity = "";
    }
    if (!cancelled && (farEnough || flicked)) onClose();
  }

  return createPortal(
    <div
      ref={rootRef}
      className={`fixed inset-0 z-(--z-sheet) ${closing ? "pointer-events-none" : ""}`}
      inert={closing}
      onKeyDown={onKeyDown}
    >
      <div
        ref={backdropRef}
        aria-hidden="true"
        onClick={onClose}
        className={`absolute inset-0 bg-overlay transition-opacity duration-(--duration-normal) ease-calm starting:opacity-0 ${
          closing ? "opacity-0" : "opacity-100"
        }`}
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={description ? descriptionId : undefined}
        tabIndex={-1}
        className={`absolute inset-x-0 bottom-0 mx-auto flex max-h-[85dvh] w-full max-w-content flex-col rounded-t-lg bg-card pb-[env(safe-area-inset-bottom)] text-ink shadow-lg outline-none transition-transform duration-(--duration-normal) ease-calm starting:translate-y-full ${
          closing ? "translate-y-full" : "translate-y-0"
        }`}
      >
        <div
          className="cursor-grab touch-none px-4 pt-2 select-none active:cursor-grabbing"
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={() => endDrag(false)}
          onPointerCancel={() => endDrag(true)}
        >
          <div aria-hidden="true" className="mx-auto h-1.5 w-10 rounded-full bg-line" />
          <div className="mt-1 flex items-start gap-2">
            <div className="min-w-0 flex-1 pt-2.5">
              <h2 id={titleId} className="text-lg font-medium">
                {title}
              </h2>
              {description ? (
                <div id={descriptionId} className="mt-0.5 text-sm text-ink-2">
                  {description}
                </div>
              ) : null}
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label={closeLabel}
              className="-me-2 inline-flex size-11 shrink-0 items-center justify-center rounded-md text-ink-2 transition-colors duration-(--duration-fast) hover:bg-well hover:text-ink"
            >
              <X aria-hidden="true" className="size-5" />
            </button>
          </div>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 pt-2 pb-4">{children}</div>
      </div>
    </div>,
    document.body,
  );
}
