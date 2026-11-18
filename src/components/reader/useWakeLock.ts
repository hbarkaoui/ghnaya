"use client";

import { useEffect, useState, useSyncExternalStore } from "react";

type Status = "pending" | "active" | "failed";

const noopSubscribe = () => () => {};

/**
 * Garde l'écran allumé pendant la séance (Screen Wake Lock API).
 * Le verrou est relâché par le navigateur quand la page passe en arrière-plan : on le redemande au retour.
 * `supported` vaut true côté serveur, pour ne jamais afficher l'astuce par erreur avant l'hydratation.
 */
export function useWakeLock(enabled = true) {
  const supported = useSyncExternalStore(
    noopSubscribe,
    () => "wakeLock" in navigator,
    () => true,
  );
  const [status, setStatus] = useState<Status>("pending");

  useEffect(() => {
    if (!enabled || !supported) return;
    let sentinel: WakeLockSentinel | null = null;
    let cancelled = false;

    const request = () => {
      navigator.wakeLock
        .request("screen")
        .then((lock) => {
          if (cancelled) {
            void lock.release();
            return;
          }
          sentinel = lock;
          setStatus("active");
        })
        .catch(() => {
          if (!cancelled) setStatus("failed");
        });
    };

    const onVisibility = () => {
      if (document.visibilityState === "visible" && (!sentinel || sentinel.released)) request();
    };

    request();
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      cancelled = true;
      document.removeEventListener("visibilitychange", onVisibility);
      void sentinel?.release();
    };
  }, [enabled, supported]);

  return { supported, status, needsHint: !supported || status === "failed" };
}
