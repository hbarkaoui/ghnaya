"use client"; // Les limites d'erreur sont des composants client.

import { ErrorView } from "@/components/system/ErrorView";

/**
 * Erreur pendant le rendu d'une page ou d'une mise en page imbriquée (pas de la mise en page racine :
 * voir global-error.tsx). L'en-tête et la barre d'onglets de la mise en page racine restent affichés.
 */
export default function RootError({ error, retry }: { error: unknown; retry: () => void }) {
  return <ErrorView error={error} retry={retry} />;
}
