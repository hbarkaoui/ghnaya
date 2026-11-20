import { notFound } from "next/navigation";

/**
 * Page d'aperçu (développement uniquement) : une erreur levée pendant le rendu côté serveur, pour voir
 * la page d'erreur (app/error.tsx) avec sa référence `digest`. « Réessayer » échoue à nouveau, exprès.
 */
export default function ErrorPreviewPage(): never {
  if (process.env.NODE_ENV === "production") notFound();
  throw new Error("Aperçu : erreur provoquée pendant le rendu de la page (/apercu/etats/erreur).");
}
