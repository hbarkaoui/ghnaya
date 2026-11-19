import { describe, expect, it } from "vitest";
import { isolate } from "@/lib/text/isolate";

describe("isolate", () => {
  it("entoure le texte d'un isolat de direction (FSI … PDI)", () => {
    expect(isolate("Séance du jeudi")).toBe("⁨Séance du jeudi⁩");
  });

  it("protège un nom latin dans une phrase arabe, ou l'inverse", () => {
    const sentence = `أُضيفت إلى «${isolate("Mes préférées!")}»`;
    expect(sentence).toContain("⁨Mes préférées!⁩");
  });
});
