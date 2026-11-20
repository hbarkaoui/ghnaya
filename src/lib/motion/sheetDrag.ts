/**
 * Glissement vers le bas qui ferme une feuille : la feuille suit le doigt, puis, au lâcher, se ferme si
 * elle est descendue assez loin ou si le geste était rapide ; sinon elle remonte.
 */

/** 96 px, ou le quart de la hauteur de la feuille si elle est plus petite. */
const CLOSE_DISTANCE_PX = 96;
const CLOSE_DISTANCE_RATIO = 0.25;
/** Un geste rapide (« lancer ») ferme aussi, même court, à partir de 24 px. */
const FLICK_PX_PER_MS = 0.5;
const FLICK_MIN_PX = 24;

/** Décalage de la feuille sous le doigt : vers le bas seulement, sans dépasser sa position ouverte. */
export function sheetDragOffset(startY: number, currentY: number): number {
  return Math.max(0, currentY - startY);
}

/** Au lâcher : la feuille se ferme-t-elle ? `dy` en px, `elapsedMs` depuis le début du geste. */
export function shouldCloseSheet({ dy, elapsedMs, height }: { dy: number; elapsedMs: number; height: number }): boolean {
  const farEnough = dy > Math.min(CLOSE_DISTANCE_PX, height * CLOSE_DISTANCE_RATIO);
  const velocity = dy / Math.max(1, elapsedMs);
  const flicked = velocity > FLICK_PX_PER_MS && dy > FLICK_MIN_PX;
  return farEnough || flicked;
}

/** Opacité du fond pendant le glissement : il s'estompe à mesure que la feuille descend. */
export function sheetBackdropOpacity(dy: number, height: number): number {
  if (height <= 0) return 1;
  return 1 - Math.min(1, dy / height);
}
