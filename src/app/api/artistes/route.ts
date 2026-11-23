import { canContribute } from "@/lib/auth/permissions";
import { suggestArtistsFromDb } from "@/lib/catalog/artistSuggestions";
import { ARTIST_NAME_MAX_LENGTH } from "@/lib/contribution/validate";
import { allowArtistSuggestion } from "@/lib/moderation/limits";
import { getCurrentUser } from "@/lib/session";

/**
 * Autocomplétion des artistes du formulaire de proposition (écart 4). Réservée à qui peut proposer :
 * ni un visiteur ni une adresse non vérifiée n'interroge la table des artistes.
 */
export async function GET(request: Request): Promise<Response> {
  const user = await getCurrentUser();
  if (!canContribute(user)) return Response.json({ artists: [] }, { status: 401 });
  if (!(await allowArtistSuggestion(user!.id))) return Response.json({ artists: [] }, { status: 429 });
  const q = new URL(request.url).searchParams.get("q") ?? "";
  const artists = await suggestArtistsFromDb(q.slice(0, ARTIST_NAME_MAX_LENGTH));
  return Response.json({ artists }, { headers: { "Cache-Control": "private, no-store" } });
}
