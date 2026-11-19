/**
 * Isole un texte de l'utilisateur (nom de playlist, titre) inséré dans une phrase de l'interface :
 * FIRST STRONG ISOLATE … POP DIRECTIONAL ISOLATE. Un nom latin dans une phrase arabe, ou l'inverse,
 * garde ainsi son sens d'écriture sans déplacer la ponctuation qui l'entoure.
 */
export const isolate = (text: string): string => `⁨${text}⁩`;
