import { describe, expect, it, vi } from "vitest";
import { generateAligned } from "@/lib/translit/generate";
import type { TranslitGenerator } from "@/lib/translit/generator";

const INPUT = { lyrics: "يا ليل\nطوّل", dialect: "tn" as const };

describe("generateAligned", () => {
  it("renvoie une translittération alignée dès le premier essai", async () => {
    const generator = vi.fn<TranslitGenerator>(async () => "ya lil\ntawwel\n");
    await expect(generateAligned(generator, INPUT)).resolves.toEqual({ ok: true, text: "ya lil\ntawwel" });
    expect(generator).toHaveBeenCalledTimes(1);
    expect(generator.mock.calls[0][1]).toBeInstanceOf(AbortSignal);
  });

  it("réessaie une fois quand l'alignement est mauvais", async () => {
    const generator = vi.fn<TranslitGenerator>().mockResolvedValueOnce("ya lil tawwel").mockResolvedValueOnce("ya lil\ntawwel");
    await expect(generateAligned(generator, INPUT)).resolves.toEqual({ ok: true, text: "ya lil\ntawwel" });
    expect(generator).toHaveBeenCalledTimes(2);
  });

  it("abandonne après deux alignements mauvais", async () => {
    const generator = vi.fn<TranslitGenerator>(async () => "ya lil tawwel");
    await expect(generateAligned(generator, INPUT)).resolves.toEqual({ ok: false, reason: "misaligned" });
    expect(generator).toHaveBeenCalledTimes(2);
  });

  it("renvoie une erreur sans réessayer quand le service échoue", async () => {
    const generator = vi.fn<TranslitGenerator>(async () => {
      throw new Error("503");
    });
    await expect(generateAligned(generator, INPUT)).resolves.toEqual({ ok: false, reason: "error", detail: "503" });
    expect(generator).toHaveBeenCalledTimes(1);
  });

  it("abandonne au délai, même si le service ignore le signal, et annule l'appel", async () => {
    let received: AbortSignal | undefined;
    const generator: TranslitGenerator = (_input, signal) => {
      received = signal;
      return new Promise(() => undefined);
    };
    await expect(generateAligned(generator, INPUT, 50)).resolves.toEqual({ ok: false, reason: "timeout" });
    expect(received?.aborted).toBe(true);
  });
});
