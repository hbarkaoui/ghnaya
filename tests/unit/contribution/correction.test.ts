import { describe, expect, it } from "vitest";
import { formValuesFromSong, isSameAsSong } from "@/lib/contribution/correction";
import type { Song } from "@/types/catalog";
import type { ProposalPayload } from "@/types/proposal";

const SONG: Song = {
  id: "s-sidi-mansour",
  titleAr: "سيدي منصور",
  titleLatin: "Sidi Mansour",
  dialect: "tn",
  source: "lrclib",
  artists: [{ id: "a-saber", nameAr: "صابر الرباعي", nameLatin: "Saber Rebai", role: "main" }],
  lyrics: "يا ليل طوّل شوية\nخلّي الغناية تكمّل",
  lyricsTranslit: null,
  translitStatus: "none",
};

const SAME: ProposalPayload = {
  titleAr: "سيدي منصور",
  titleLatin: "Sidi Mansour",
  artists: [{ id: "a-saber", nameAr: "صابر الرباعي", nameLatin: "Saber Rebai" }],
  lyrics: "يا ليل طوّل شوية\nخلّي الغناية تكمّل",
  lyricsTranslit: null,
  dialect: "tn",
};

describe("formValuesFromSong", () => {
  it("pré-remplit le formulaire de correction, artistes dans l'écriture de l'interface", () => {
    expect(formValuesFromSong(SONG, "fr")).toEqual({
      titleAr: "سيدي منصور",
      titleLatin: "Sidi Mansour",
      artists: ["Saber Rebai"],
      lyrics: SONG.lyrics,
      dialect: "tn",
      translit: "",
    });
    expect(formValuesFromSong(SONG, "ar").artists).toEqual(["صابر الرباعي"]);
  });

  it("remplace un titre absent par un champ vide et reprend la translittération existante", () => {
    const values = formValuesFromSong({ ...SONG, titleLatin: null, lyricsTranslit: "ya lil\nkhalli" }, "fr");
    expect(values.titleLatin).toBe("");
    expect(values.translit).toBe("ya lil\nkhalli");
  });
});

describe("isSameAsSong", () => {
  it("reconnaît une correction qui ne change rien", () => {
    expect(isSameAsSong(SAME, SONG)).toBe(true);
  });

  it("voit chaque champ modifié", () => {
    expect(isSameAsSong({ ...SAME, titleLatin: "Sidi Mansur" }, SONG)).toBe(false);
    expect(isSameAsSong({ ...SAME, lyrics: `${SAME.lyrics}\nسطر جديد` }, SONG)).toBe(false);
    expect(isSameAsSong({ ...SAME, dialect: "msa" }, SONG)).toBe(false);
    expect(isSameAsSong({ ...SAME, lyricsTranslit: "ya lil\nkhalli" }, SONG)).toBe(false);
    expect(isSameAsSong({ ...SAME, artists: [...SAME.artists, { id: null, nameAr: null, nameLatin: "Emel" }] }, SONG)).toBe(
      false,
    );
  });

  it("ignore les différences d'espaces et de fins de ligne dans les paroles", () => {
    expect(isSameAsSong({ ...SAME, lyrics: "يا ليل طوّل شوية  \r\nخلّي الغناية تكمّل\n" }, SONG)).toBe(true);
  });
});
