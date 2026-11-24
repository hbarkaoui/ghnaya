import { appleTouchIcon } from "@/components/brand/appleTouchIcon";

/**
 * iOS demande aussi l'icône à ces adresses fixes, à la racine, quand il ajoute la page à l'écran d'accueil.
 * Sans réponse, il affiche la première lettre du titre (« G ») au lieu du logo.
 * Mise en cache explicite : iOS ne garde pas une icône servie en `no-store`.
 */
export function GET() {
  return appleTouchIcon({ headers: { "Cache-Control": "public, max-age=86400" } });
}
