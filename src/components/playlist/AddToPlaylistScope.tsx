import type { ReactNode } from "react";
import { clubsAnimatedBy } from "@/lib/auth/permissions";
import { signInHref } from "@/lib/auth/returnPath";
import { toAddTarget } from "@/lib/playlist/addToPlaylist";
import { editablePlaylistsOf } from "@/lib/playlist/queries";
import { getCurrentUser } from "@/lib/session";
import { AddToPlaylistProvider } from "./AddToPlaylist";

/**
 * Portée serveur des boutons « Ajouter à une playlist » d'une page : lit les playlists modifiables de
 * l'utilisateur et les clubs qu'il anime, ou, pour un visiteur, prépare le renvoi vers la connexion.
 * `returnTo` : la page courante, où revenir après la connexion.
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
    <AddToPlaylistProvider signedIn targets={(await editablePlaylistsOf(user)).map(toAddTarget)} clubs={clubsAnimatedBy(user)}>
      {children}
    </AddToPlaylistProvider>
  );
}
