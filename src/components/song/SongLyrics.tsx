"use client";

import { LyricsView } from "@/components/lyrics/LyricsView";
import { TranslitStatus } from "@/components/lyrics/TranslitStatus";
import { TranslitToggle } from "@/components/lyrics/TranslitToggle";
import { useTranslit } from "@/components/lyrics/useTranslit";
import { useReaderPrefs } from "@/components/reader/useReaderPrefs";
import type { Song } from "@/types/catalog";

/**
 * Paroles de la fiche chanson, avec la bascule Arabe / Arabe + latin / Latin.
 * Le mode est celui du lecteur (même préférence mémorisée) : la translittération activée ici reste
 * active en mode séance, et inversement. La génération à la demande est celle du lecteur.
 */
export function SongLyrics({ song }: { song: Pick<Song, "id" | "lyrics" | "lyricsTranslit" | "translitStatus"> }) {
  const { mode, setMode } = useReaderPrefs();
  const translit = useTranslit([song], song.id, mode !== "ar");

  return (
    <>
      <TranslitToggle mode={mode} onChange={setMode} tone="page" className="mb-5" />
      <TranslitStatus view={translit.view} status={translit.status} onRetry={translit.retry} tone="page" />
      <div data-lyrics="page">
        <LyricsView key={mode} lyrics={song.lyrics} translit={translit.text} mode={mode} />
      </div>
    </>
  );
}
