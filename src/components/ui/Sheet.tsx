"use client";

import { X } from "lucide-react";
import { useEffect, useId, useRef, useState, type KeyboardEvent, type PointerEvent, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { readMotionDuration } from "@/lib/motion/duration";
import { sheetBackdropOpacity, sheetDragOffset, shouldCloseSheet } from "@/lib/motion/sheetDrag";

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

/** Mouvement de la feuille et du fond, à l'ouverture comme à la fermeture (tokens --duration-normal, --easing-default). */
const MOTION = "duration-(--duration-normal) ease-calm";

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
 *  - Mouvement : la feuille monte du bas pendant que le fond apparaît en fondu, et redescend à la fermeture
 *    (--duration-normal, --easing-default, sans rebond). Au glissement, elle suit le doigt puis termine son
 *    mouvement depuis là. prefers-reduced-motion ramène les durées à 0 : ouverture et fermeture instantanées.
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
  const drag = useRef<{ startY: number; startedAt: number; dy: number } | null>(null);
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
    // Démontage à la fin de la descente : la durée vient du même token que le CSS (0 si le mouvement est réduit).
    const timer = window.setTimeout(() => setPresent(false), readMotionDuration("--duration-normal"));
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
    drag.current = { startY: event.clientY, startedAt: performance.now(), dy: 0 };
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function onPointerMove(event: PointerEvent<HTMLDivElement>) {
    const state = drag.current;
    const panel = panelRef.current;
    if (!state || !panel) return;
    // La feuille suit le doigt sans transition ; le fond s'estompe à mesure qu'elle descend.
    state.dy = sheetDragOffset(state.startY, event.clientY);
    panel.style.transition = "none";
    panel.style.translate = `0 ${state.dy}px`;
    const backdrop = backdropRef.current;
    if (backdrop) {
      backdrop.style.transition = "none";
      backdrop.style.opacity = String(sheetBackdropOpacity(state.dy, panel.offsetHeight));
    }
  }

  function endDrag(cancelled: boolean) {
    const state = drag.current;
    drag.current = null;
    const panel = panelRef.current;
    if (!state || !panel) return;
    const close = shouldCloseSheet({
      dy: state.dy,
      elapsedMs: performance.now() - state.startedAt,
      height: panel.offsetHeight,
    });
    // On rend la main aux classes : la feuille termine son mouvement depuis sa position sous le doigt,
    // vers le bas (fermeture) ou vers le haut (elle reste ouverte), avec la même courbe et la même durée.
    panel.style.transition = "";
    panel.style.translate = "";
    if (backdropRef.current) {
      backdropRef.current.style.transition = "";
      backdropRef.current.style.opacity = "";
    }
    if (!cancelled && close) onClose();
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
        className={`absolute inset-0 bg-overlay transition-opacity ${MOTION} starting:opacity-0 ${
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
        className={`absolute inset-x-0 bottom-0 mx-auto flex max-h-[85dvh] w-full max-w-content flex-col rounded-t-lg bg-card pb-[env(safe-area-inset-bottom)] text-ink shadow-lg outline-none transition-transform ${MOTION} starting:translate-y-full ${
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
