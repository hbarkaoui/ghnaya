"use client";

import { Copy } from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { useActionState, useEffect, useRef } from "react";
import { copyPlaylistToMine, type CopyResult } from "@/app/actions/playlist";

/**
 * « Copier dans mes playlists », pour un membre qui lit la playlist de son club (spec §10).
 * La copie est confirmée par un message en ligne, avec un lien vers la copie, qui reçoit le focus.
 *
 * Tâche 9 : confirmer aussi avec le `Toast` « Copiée dans vos playlists » quand il existera ; le message
 * en ligne peut alors devenir réservé aux lecteurs d'écran, ou disparaître si le Toast est annoncé.
 */
export function CopyPlaylistButton({ playlistId }: { playlistId: string }) {
  const t = useTranslations("playlistPage");
  const [result, copy, pending] = useActionState<CopyResult | null>(() => copyPlaylistToMine(playlistId), null);
  const openRef = useRef<HTMLAnchorElement>(null);

  // Le bouton disparaît après la copie : le focus passe au lien vers la copie.
  useEffect(() => {
    if (result?.ok) openRef.current?.focus();
  }, [result]);

  return (
    <div className="flex flex-col items-start gap-2">
      {result?.ok ? null : (
        <form action={copy}>
          <button
            type="submit"
            disabled={pending}
            className="inline-flex min-h-11 items-center gap-2 rounded-md border border-line px-4 font-medium text-ink hover:bg-well disabled:opacity-60"
          >
            <Copy aria-hidden="true" className="size-4" />
            {pending ? t("copying") : t("copy")}
          </button>
        </form>
      )}
      {/* Toujours présent dans le DOM, pour que les lecteurs d'écran annoncent le message qui y apparaît. */}
      <p role="status" className="text-sm">
        {result?.ok ? (
          <span className="inline-flex flex-wrap items-center gap-x-2 rounded-md bg-success-soft px-3 py-1.5 text-success">
            {t("copied")}{" "}
            <Link
              ref={openRef}
              href={`/playlists/${result.id}`}
              className="inline-flex min-h-11 items-center font-medium underline underline-offset-4"
            >
              {t("openCopy")}
            </Link>
          </span>
        ) : result ? (
          <span className="text-error">{t("copyFailed")}</span>
        ) : null}
      </p>
    </div>
  );
}
