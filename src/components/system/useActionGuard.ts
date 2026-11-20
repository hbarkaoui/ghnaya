"use client";

import { unstable_rethrow } from "next/navigation";
import { useTranslations } from "next-intl";
import { useCallback, useMemo } from "react";
import { useToast } from "@/components/ui/Toast";
import { actionFailureKind, keepStateOnFailure, settle, type ActionFailed } from "@/lib/system/actionFailure";

export { ACTION_FAILED } from "@/lib/system/actionFailure";

/**
 * Garde les actions serveur appelées depuis le client : un échec (réseau coupé, serveur injoignable,
 * erreur du serveur) affiche un toast d'erreur au lieu d'échouer en silence ou de remplacer la page
 * par la page d'erreur. Les redirections et « introuvable » de Next.js (redirect, notFound) passent.
 *
 *  - appel à la main : `const result = await guard(addSongToPlaylist(id, songId));`
 *    puis `if (result === ACTION_FAILED) return;` (le toast est déjà affiché) ;
 *  - formulaire : `useActionState(guardState(createClubAction), null)` ; après un échec, l'état
 *    précédent reste, et la saisie avec.
 */
export function useActionGuard() {
  const toast = useToast();
  const t = useTranslations("system.actionFailed");

  const report = useCallback(
    (error: unknown) => {
      unstable_rethrow(error);
      const kind = actionFailureKind(error, navigator.onLine);
      // Un réseau coupé est attendu (avertissement) ; une erreur du serveur est un défaut (erreur).
      if (kind === "network") console.warn(error);
      else console.error(error);
      toast(t(kind), "error");
    },
    [toast, t],
  );

  return useMemo(
    () => ({
      guard: <T>(promise: Promise<T>): Promise<T | ActionFailed> => settle(promise, report),
      guardState: <S, P>(action: (state: S, payload: P) => Promise<S>) => keepStateOnFailure(action, report),
      report,
    }),
    [report],
  );
}
