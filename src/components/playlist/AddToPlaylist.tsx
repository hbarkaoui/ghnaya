"use client";

import { ListPlus } from "lucide-react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { createContext, useContext, useState, type ReactNode } from "react";
import { songDisplayTitle } from "@/components/song/songTitle";
import type { AddTarget } from "@/lib/playlists/addToPlaylist";
import { isolate } from "@/lib/text/isolate";
import { AddToPlaylistSheet, type ClubRef, type SheetSong } from "./AddToPlaylistSheet";

type Scope =
  | { signedIn: false; signInHref: string }
  | { signedIn: true; targets: AddTarget[]; clubs: ClubRef[] };

type ContextValue =
  | { signedIn: false; signInHref: string }
  | { signedIn: true; openFor: (song: SheetSong, trigger: HTMLElement) => void };

const AddToPlaylistContext = createContext<ContextValue | null>(null);

const byMostRecent = (a: AddTarget, b: AddTarget) => b.updatedAt.localeCompare(a.updatedAt);

/**
 * Portée de la feuille « Ajouter à une playlist » : une seule feuille pour toute une liste de résultats.
 * Rendue par AddToPlaylistScope (serveur), qui fournit les playlists modifiables de l'utilisateur, ou,
 * pour un visiteur, le lien vers la connexion.
 */
export function AddToPlaylistProvider({ children, ...scope }: Scope & { children: ReactNode }) {
  const serverTargets = scope.signedIn ? scope.targets : null;
  const [targets, setTargets] = useState<AddTarget[]>(serverTargets ?? []);
  // Un nouveau rendu serveur (navigation, rafraîchissement) fait foi : il contient déjà nos ajouts.
  const [lastServerTargets, setLastServerTargets] = useState(serverTargets);
  if (serverTargets !== lastServerTargets) {
    setLastServerTargets(serverTargets);
    setTargets(serverTargets ?? []);
  }

  const [active, setActive] = useState<{ song: SheetSong; trigger: HTMLElement } | null>(null);
  const [open, setOpen] = useState(false);

  const value: ContextValue = scope.signedIn
    ? {
        signedIn: true,
        openFor: (song, trigger) => {
          setActive({ song, trigger });
          setOpen(true);
        },
      }
    : { signedIn: false, signInHref: scope.signInHref };

  const updateTarget = (target: AddTarget) =>
    setTargets((current) => [target, ...current.filter((t) => t.id !== target.id)].sort(byMostRecent));

  return (
    <AddToPlaylistContext value={value}>
      {children}
      {scope.signedIn && active ? (
        <AddToPlaylistSheet
          open={open}
          onClose={() => setOpen(false)}
          song={active.song}
          returnFocus={active.trigger}
          targets={targets}
          clubs={scope.clubs}
          onTargetChange={updateTarget}
        />
      ) : null}
    </AddToPlaylistContext>
  );
}

const STYLES = {
  // Action d'un résultat de recherche : compacte, pour laisser la place au titre et à l'extrait.
  compact:
    "inline-flex min-h-11 items-center gap-1.5 rounded-md border border-line-subtle bg-card px-3 text-sm font-medium text-ink transition-colors duration-(--duration-fast) hover:bg-well",
  // Bouton secondaire de la fiche chanson, à côté de « Mode séance ». Le libellé ne se coupe pas : quand
  // les deux boutons ne tiennent pas sur une ligne (375 px en français), il passe dessous, pleine largeur.
  full: "inline-flex min-h-12 flex-1 items-center justify-center gap-2 rounded-md border border-line bg-card px-5 font-medium whitespace-nowrap text-ink transition-colors duration-(--duration-fast) hover:bg-well",
};

/**
 * « Ajouter à une playlist » : ouvre la feuille ; pour un visiteur, mène à la connexion, qui ramène
 * ensuite à la page courante (`/connexion?retour=`).
 */
export function AddToPlaylistButton({ song, variant }: { song: SheetSong; variant: "compact" | "full" }) {
  const scope = useContext(AddToPlaylistContext);
  if (!scope) throw new Error("AddToPlaylistButton doit être rendu sous AddToPlaylistScope.");
  const t = useTranslations("addToPlaylist");
  const locale = useLocale();

  // La version compacte n'affiche que « Ajouter » : son nom accessible précise la chanson et la cible
  // (et commence par le libellé visible).
  const label = variant === "compact" ? t("buttonShort") : t("button");
  const ariaLabel =
    variant === "compact" ? t("buttonNamed", { title: isolate(songDisplayTitle(song, locale)) }) : undefined;
  const content = (
    <>
      <ListPlus aria-hidden="true" className={`${variant === "compact" ? "size-4" : "size-5"} rtl:-scale-x-100`} />
      {label}
    </>
  );

  if (!scope.signedIn) {
    return (
      <Link href={scope.signInHref} aria-label={ariaLabel} className={STYLES[variant]}>
        {content}
      </Link>
    );
  }

  return (
    <button
      type="button"
      aria-label={ariaLabel}
      aria-haspopup="dialog"
      onClick={(event) => scope.openFor(song, event.currentTarget)}
      className={STYLES[variant]}
    >
      {content}
    </button>
  );
}
