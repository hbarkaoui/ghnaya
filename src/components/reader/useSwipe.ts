"use client";

import { useRef, type PointerEvent } from "react";

const SWIPE_MIN_PX = 60;
const TAP_MAX_PX = 10;
const TAP_MAX_MS = 350;

type Options = {
  rtl: boolean;
  onNext: () => void;
  onPrevious: () => void;
  onTap: () => void;
};

/**
 * Glissement horizontal pour changer de chanson, toucher simple pour afficher ou masquer les contrôles.
 * Le sens suit celui de l'interface : en français, « suivant » se fait en glissant vers la gauche ;
 * en arabe, en glissant vers la droite. Le défilement vertical reste natif (touch-action: pan-y).
 */
export function useSwipe({ rtl, onNext, onPrevious, onTap }: Options) {
  const start = useRef<{ x: number; y: number; t: number } | null>(null);

  return {
    onPointerDown: (e: PointerEvent) => {
      start.current = { x: e.clientX, y: e.clientY, t: performance.now() };
    },
    onPointerUp: (e: PointerEvent) => {
      const s = start.current;
      start.current = null;
      if (!s) return;
      // Un toucher sur un bouton ou un lien (écran de fin) n'est ni un glissement ni un toucher sur les paroles.
      if (e.target instanceof Element && e.target.closest("button, a")) return;
      const dx = e.clientX - s.x;
      const dy = e.clientY - s.y;
      if (Math.abs(dx) > SWIPE_MIN_PX && Math.abs(dx) > Math.abs(dy) * 1.5) {
        const towardNext = rtl ? dx > 0 : dx < 0;
        if (towardNext) onNext();
        else onPrevious();
        return;
      }
      if (Math.abs(dx) < TAP_MAX_PX && Math.abs(dy) < TAP_MAX_PX && performance.now() - s.t < TAP_MAX_MS) {
        onTap();
      }
    },
    onPointerCancel: () => {
      start.current = null;
    },
  };
}
