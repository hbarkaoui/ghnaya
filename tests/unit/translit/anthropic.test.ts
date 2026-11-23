import type Anthropic from "@anthropic-ai/sdk";
import { describe, expect, it, vi } from "vitest";
import { DEFAULT_TRANSLIT_MODEL, anthropicGenerator } from "@/lib/translit/anthropic";
import { TRANSLIT_SYSTEM, translitUserMessage } from "@/lib/translit/prompt";

/** Faux client : seule `beta.messages.create` est appelée. */
function clientReturning(response: { stop_reason: string; content: { type: string; text?: string }[] }) {
  const create = vi.fn<(body: unknown, options?: unknown) => Promise<typeof response>>(async () => response);
  return { client: { beta: { messages: { create } } } as unknown as Anthropic, create };
}

const INPUT = { lyrics: "يا ليل\nطوّل", dialect: "tn" as const };

describe("anthropicGenerator", () => {
  it("envoie le prompt au modèle par défaut, avec l'effort bas, les modèles de secours et le signal", async () => {
    const { client, create } = clientReturning({ stop_reason: "end_turn", content: [{ type: "text", text: "ya lil\ntawwel" }] });
    const signal = new AbortController().signal;
    await expect(anthropicGenerator({ client })(INPUT, signal)).resolves.toBe("ya lil\ntawwel");
    expect(create).toHaveBeenCalledWith(
      {
        model: DEFAULT_TRANSLIT_MODEL,
        max_tokens: 16000,
        betas: ["server-side-fallback-2026-07-01"],
        fallbacks: "default",
        output_config: { effort: "low" },
        system: TRANSLIT_SYSTEM,
        messages: [{ role: "user", content: translitUserMessage(INPUT.lyrics, INPUT.dialect) }],
      },
      { signal },
    );
  });

  it("prend le modèle configuré", async () => {
    const { client, create } = clientReturning({ stop_reason: "end_turn", content: [{ type: "text", text: "x" }] });
    await anthropicGenerator({ client, model: "claude-sonnet-5-5" })(INPUT, new AbortController().signal);
    expect(create.mock.calls[0][0]).toMatchObject({ model: "claude-sonnet-5-5" });
  });

  it("ne garde que les blocs de texte (un bloc de secours peut précéder la réponse)", async () => {
    const { client } = clientReturning({
      stop_reason: "end_turn",
      content: [{ type: "fallback" }, { type: "text", text: "ya lil\n" }, { type: "text", text: "tawwel" }],
    });
    await expect(anthropicGenerator({ client })(INPUT, new AbortController().signal)).resolves.toBe("ya lil\ntawwel");
  });

  it("lève une erreur sur un refus ou une réponse coupée", async () => {
    for (const stop_reason of ["refusal", "max_tokens"]) {
      const { client } = clientReturning({ stop_reason, content: [{ type: "text", text: "ya" }] });
      await expect(anthropicGenerator({ client })(INPUT, new AbortController().signal)).rejects.toThrow(stop_reason);
    }
  });
});
