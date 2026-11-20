import { describe, expect, it } from "vitest";
import { changedFields, songFromProposal } from "@/lib/moderation/apply";
import type { Song } from "@/types/catalog";
import type { ProposalPayload } from "@/types/proposal";

const SABER = { id: "a-saber", nameAr: "صابر الرباعي", nameLatin: "Saber Rebai", role: "main" as const };

const SONG: Song = {
  id: "s-sidi-mansour",
  titleAr: "سيدي منصور",
  titleLatin: "Sidi Mansour",
  dialect: "tn",
  source: "lrclib",
  artists: [SABER],
  lyrics: "يا ليل طوّل شوية\nخلّي الغناية تكمّل",
  lyricsTranslit: "ya lil tawwel chwaya\nkhalli el ghnaya tkammel",
  translitStatus: "auto",
};

/** La proposition telle que le formulaire de correction la pré-remplit : identique à la chanson. */
const unchanged = (): ProposalPayload => ({
  titleAr: SONG.titleAr,
  titleLatin: SONG.titleLatin,
  artists: [{ id: SABER.id, nameAr: SABER.nameAr, nameLatin: SABER.nameLatin }],
  lyrics: SONG.lyrics,
  lyricsTranslit: SONG.lyricsTranslit,
  dialect: SONG.dialect,
});

const ids = { songId: "s-nouvelle", artistId: (i: number) => `a-nouveau-${i}` };

describe("changedFields : les champs modifiés par une correction, hors paroles", () => {
  it("ne signale rien pour une proposition identique", () => {
    expect(changedFields(unchanged(), SONG)).toEqual([]);
  });

  it("signale les titres, le dialecte et la translittération modifiés", () => {
    const payload = { ...unchanged(), titleLatin: "Sidi Mansur", dialect: "maghreb_other" as const, lyricsTranslit: null };
    expect(changedFields(payload, SONG)).toEqual(["titleLatin", "dialect", "translit"]);
  });

  it("signale un artiste ajouté, retiré ou nouveau", () => {
    const BOUCHNAK = { id: "a-bouchnak", nameAr: "لطفي بوشناق", nameLatin: "Lotfi Bouchnak" };
    expect(changedFields({ ...unchanged(), artists: [...unchanged().artists, BOUCHNAK] }, SONG)).toEqual(["artists"]);
    expect(changedFields({ ...unchanged(), artists: [] }, SONG)).toEqual(["artists"]);
    expect(
      changedFields({ ...unchanged(), artists: [{ id: null, nameAr: null, nameLatin: "Saber Rebai" }] }, SONG),
    ).toEqual(["artists"]);
  });

  it("ignore les différences d'espaces et de fins de ligne dans la translittération", () => {
    const payload = { ...unchanged(), lyricsTranslit: `${SONG.lyricsTranslit}\r\n` };
    expect(changedFields(payload, SONG)).toEqual([]);
  });
});

describe("songFromProposal : la chanson publiée à l'approbation (spec §8.5)", () => {
  it("crée la chanson d'un ajout, source « Proposition », avec un artiste nouveau", () => {
    const payload: ProposalPayload = {
      titleAr: "لاموني",
      titleLatin: null,
      artists: [{ id: SABER.id, nameAr: SABER.nameAr, nameLatin: SABER.nameLatin }, { id: null, nameAr: null, nameLatin: "Nouvel Artiste" }],
      lyrics: "سطر أول\nسطر ثاني",
      lyricsTranslit: null,
      dialect: "tn",
    };
    expect(songFromProposal(payload, undefined, ids)).toEqual({
      id: "s-nouvelle",
      titleAr: "لاموني",
      titleLatin: null,
      dialect: "tn",
      source: "contribution",
      artists: [SABER, { id: "a-nouveau-1", nameAr: null, nameLatin: "Nouvel Artiste", role: "main" }],
      lyrics: "سطر أول\nسطر ثاني",
      lyricsTranslit: null,
      translitStatus: "none",
    });
  });

  it("marque comme relue la translittération fournie avec un ajout", () => {
    const payload = { ...unchanged(), lyricsTranslit: "ligne une\nligne deux" };
    expect(songFromProposal(payload, undefined, ids)).toMatchObject({
      lyricsTranslit: "ligne une\nligne deux",
      translitStatus: "reviewed",
    });
  });

  it("met à jour une correction en gardant l'identifiant, la source et le rôle des artistes", () => {
    const feat = { ...SABER, role: "feat" as const };
    const song = { ...SONG, artists: [feat] };
    const result = songFromProposal({ ...unchanged(), titleLatin: "Sidi Mansur" }, song, ids);
    expect(result).toMatchObject({ id: SONG.id, source: "lrclib", titleLatin: "Sidi Mansur", artists: [feat] });
  });

  it("garde la translittération et son statut quand ni les paroles ni la translittération ne changent", () => {
    expect(songFromProposal({ ...unchanged(), titleLatin: "Sidi Mansur" }, SONG, ids)).toMatchObject({
      lyricsTranslit: SONG.lyricsTranslit,
      translitStatus: "auto",
    });
  });

  it("vide la translittération quand les paroles changent sans nouvelle translittération", () => {
    const payload = { ...unchanged(), lyrics: `${SONG.lyrics}\nسطر جديد`, lyricsTranslit: null };
    expect(songFromProposal(payload, SONG, ids)).toMatchObject({ lyricsTranslit: null, translitStatus: "none" });
  });

  it("vide aussi la translittération quand les paroles changent mais que l'ancienne est renvoyée telle quelle", () => {
    const payload = { ...unchanged(), lyrics: `${SONG.lyrics}\nسطر جديد` };
    expect(songFromProposal(payload, SONG, ids)).toMatchObject({ lyricsTranslit: null, translitStatus: "none" });
  });

  it("publie comme relue une translittération corrigée", () => {
    const payload = { ...unchanged(), lyricsTranslit: "ya lil tawwel chwiya\nkhalli el ghnaya tkammel" };
    expect(songFromProposal(payload, SONG, ids)).toMatchObject({
      lyricsTranslit: "ya lil tawwel chwiya\nkhalli el ghnaya tkammel",
      translitStatus: "reviewed",
    });
  });
});
