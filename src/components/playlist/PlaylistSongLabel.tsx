import { getTranslations } from "next-intl/server";
import { ArtistNames } from "@/components/song/ArtistNames";
import { Badge } from "@/components/ui/Badge";
import type { Song } from "@/types/catalog";

/**
 * Étiquette d'une chanson dans une playlist : titre arabe, titre latin, artistes. Chaque fragment porte
 * sa langue et son sens d'écriture (brief). Une chanson retirée garde son titre, estompé, avec la
 * pastille « Chanson retirée » ; si la base ne la connaît plus du tout, il ne reste que la pastille.
 */
export async function PlaylistSongLabel({
  song,
  removed,
}: {
  song: Pick<Song, "titleAr" | "titleLatin" | "artists"> | null;
  removed: boolean;
}) {
  const t = await getTranslations("playlistPage");
  const badge = <Badge className={song ? "mt-1.5" : ""}>{t("removed")}</Badge>;
  if (!song) return badge;

  const { titleAr, titleLatin } = song;
  return (
    <>
      <span className={`block ${removed ? "text-ink-3" : ""}`}>
        {titleAr ? (
          <span className="block font-medium">
            <span lang="ar" dir="rtl">
              {titleAr}
            </span>
          </span>
        ) : null}
        {titleLatin ? (
          <span className={`block ${titleAr ? `text-sm ${removed ? "" : "text-ink-2"}` : "font-medium"}`}>
            <span dir="ltr">{titleLatin}</span>
          </span>
        ) : null}
      </span>
      {removed ? (
        badge
      ) : (
        <ArtistNames artists={song.artists} className="mt-0.5 block text-sm text-ink-2" />
      )}
    </>
  );
}
