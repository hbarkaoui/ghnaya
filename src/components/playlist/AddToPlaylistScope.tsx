import type { ReactNode } from "react";
import { signInHref } from "@/lib/auth/signInHref";
import { toAddTarget } from "@/lib/playlists/addToPlaylist";
import { getCurrentUser } from "@/lib/session";
import { clubsAnimatedBy, editablePlaylistsFor } from "@/mocks/playlistMemory";
import { AddToPlaylistProvider } from "./AddToPlaylist";

/**
 * Portée serveur des boutons « Ajouter à une playlist » d'une page : lit les playlists modifiables de
 * l'utilisateur et les clubs qu'il anime, ou, pour un visiteur, prépare le renvoi vers la connexion.
 * `returnTo` : la page courante, où revenir après la connexion.
 * MAQUETTE : données fictives en mémoire ; le plan 3 lira la base, sans changer cette interface.
 */
export async function AddToPlaylistScope({ returnTo, children }: { returnTo: string; children: ReactNode }) {
  const user = await getCurrentUser();
  if (!user) {
    return (
      <AddToPlaylistProvider signedIn={false} signInHref={signInHref(returnTo)}>
        {children}
      </AddToPlaylistProvider>
    );
  }
  return (
    <AddToPlaylistProvider signedIn targets={editablePlaylistsFor(user).map(toAddTarget)} clubs={clubsAnimatedBy(user)}>
      {children}
    </AddToPlaylistProvider>
  );
}
