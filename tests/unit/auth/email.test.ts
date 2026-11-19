import { describe, expect, it } from "vitest";
import { checkEmail } from "@/lib/auth/email";

describe("checkEmail : adresse du lien magique", () => {
  it("accepte une adresse ordinaire", () => {
    expect(checkEmail("leila@exemple.tn")).toEqual({ ok: true, email: "leila@exemple.tn" });
    expect(checkEmail("sami.ben-ali+club@mail.exemple.com")).toEqual({
      ok: true,
      email: "sami.ben-ali+club@mail.exemple.com",
    });
  });

  it("retire les espaces autour et passe en minuscules, comme Auth.js", () => {
    expect(checkEmail("  Leila@Exemple.TN ")).toEqual({ ok: true, email: "leila@exemple.tn" });
  });

  it("signale une adresse manquante", () => {
    expect(checkEmail("")).toEqual({ ok: false, reason: "missing" });
    expect(checkEmail("   ")).toEqual({ ok: false, reason: "missing" });
    expect(checkEmail(null)).toEqual({ ok: false, reason: "missing" });
    expect(checkEmail(undefined)).toEqual({ ok: false, reason: "missing" });
  });

  it.each([
    ["leila"],
    ["leila@"],
    ["@exemple.tn"],
    ["leila@exemple"],
    ["leila@@exemple.tn"],
    ["lei la@exemple.tn"],
    ["leila@exemple..tn"],
    ["leila@.exemple.tn"],
    ["leila@exemple.t"],
    ["leila@-exemple.tn"],
  ])("refuse une adresse mal formée : %s", (raw) => {
    expect(checkEmail(raw)).toEqual({ ok: false, reason: "invalid" });
  });

  it("refuse plusieurs adresses à la fois (un lien envoyé à deux boîtes)", () => {
    expect(checkEmail("leila@exemple.tn,sami@exemple.tn")).toEqual({ ok: false, reason: "invalid" });
    expect(checkEmail("leila@exemple.tn;sami@exemple.tn")).toEqual({ ok: false, reason: "invalid" });
  });

  it("refuse une adresse de plus de 254 caractères", () => {
    expect(checkEmail(`${"a".repeat(250)}@exemple.tn`)).toEqual({ ok: false, reason: "invalid" });
  });
});
