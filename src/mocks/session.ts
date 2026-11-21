import type { CurrentUser } from "@/lib/auth/types";
import { PLAYLISTS } from "./catalog";

const byMostRecent = (a: { updatedAt: string }, b: { updatedAt: string }) => b.updatedAt.localeCompare(a.updatedAt);

/** Playlists des clubs de l'utilisateur, de la plus récemment modifiée à la plus ancienne. */
export const clubPlaylistsFor = (user: Pick<CurrentUser, "id" | "clubSlugs">) =>
  PLAYLISTS.filter((p) => p.club && user.clubSlugs.includes(p.club.slug)).sort(byMostRecent);

/** Playlists personnelles de l'utilisateur (`ownerId`), de la plus récemment modifiée à la plus ancienne. */
export const personalPlaylistsFor = (user: Pick<CurrentUser, "id" | "clubSlugs">) =>
  PLAYLISTS.filter((p) => p.club === null && p.ownerId === user.id).sort(byMostRecent);
