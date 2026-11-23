import { describe, expect, it } from "vitest";
import { parseBulkArgs } from "@/lib/moderation/bulk";

const ARTIST = "6f1c2a7e-8a7b-4c1d-9e2f-0a1b2c3d4e5f";

describe("parseBulkArgs", () => {
  it("lit la source, le motif, l'artiste et les deux options", () => {
    expect(parseBulkArgs(["--source", "lrclib", "--reason", "  Retrait des ayants droit.  "])).toEqual({
      ok: true,
      args: { source: "lrclib", reason: "Retrait des ayants droit.", artistId: null, dryRun: false, restore: false },
    });
    expect(parseBulkArgs(["--source", "public_domain", "--reason", "Erreur", "--artist", ARTIST, "--dry-run", "--restore"])).toEqual({
      ok: true,
      args: { source: "public_domain", reason: "Erreur", artistId: ARTIST, dryRun: true, restore: true },
    });
  });

  it("refuse une commande sans source ou sans motif, une source inconnue et un artiste qui n'est pas un UUID", () => {
    for (const argv of [
      [],
      ["--source", "lrclib"],
      ["--reason", "Motif"],
      ["--source", "youtube", "--reason", "Motif"],
      ["--source", "lrclib", "--reason", "   "],
      ["--source", "lrclib", "--reason", "Motif", "--artist", "saber-rebai"],
      ["--source", "lrclib", "--reason", "Motif", "--tout"],
      ["--source", "lrclib", "--reason", "x".repeat(1001)],
    ]) {
      expect(parseBulkArgs(argv).ok).toBe(false);
    }
  });
});
