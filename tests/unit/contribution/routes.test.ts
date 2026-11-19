import { describe, expect, it } from "vitest";
import {
  contributeHref,
  contributionsHref,
  loginHref,
  parseStatusFilter,
  prefillFromParams,
} from "@/lib/contribution/routes";

describe("parseStatusFilter", () => {
  it("lit ?statut= en français", () => {
    expect(parseStatusFilter("en-attente")).toBe("pending");
    expect(parseStatusFilter("acceptee")).toBe("approved");
    expect(parseStatusFilter("refusee")).toBe("rejected");
  });

  it("ignore une valeur inconnue ou absente", () => {
    expect(parseStatusFilter("pending")).toBeUndefined();
    expect(parseStatusFilter(undefined)).toBeUndefined();
    expect(parseStatusFilter(["acceptee", "refusee"])).toBe("approved");
  });
});

describe("contributionsHref", () => {
  it("construit l'adresse de Mes contributions, filtrée ou non", () => {
    expect(contributionsHref()).toBe("/mes-contributions");
    expect(contributionsHref({ status: "pending" })).toBe("/mes-contributions?statut=en-attente");
    expect(contributionsHref({ status: "rejected" })).toBe("/mes-contributions?statut=refusee");
  });

  it("signale la proposition qui vient d'être envoyée", () => {
    expect(contributionsHref({ sent: "p-12" })).toBe("/mes-contributions?envoyee=p-12");
  });
});

describe("loginHref", () => {
  it("renvoie vers la connexion avec la page où revenir", () => {
    expect(loginHref("/contribuer?titre=Sidi")).toBe("/connexion?retour=%2Fcontribuer%3Ftitre%3DSidi");
  });
});

describe("prefillFromParams", () => {
  it("range ?titre= dans le titre arabe ou latin selon son écriture", () => {
    expect(prefillFromParams({ titre: "Sidi Mansour" })).toEqual({ titleAr: "", titleLatin: "Sidi Mansour", artists: [] });
    expect(prefillFromParams({ titre: "سيدي منصور" })).toEqual({ titleAr: "سيدي منصور", titleLatin: "", artists: [] });
  });

  it("accepte les deux titres et plusieurs artistes", () => {
    expect(prefillFromParams({ titre: ["سيدي منصور", "Sidi Mansour"], artiste: ["Saber Rebai", " "] })).toEqual({
      titleAr: "سيدي منصور",
      titleLatin: "Sidi Mansour",
      artists: ["Saber Rebai"],
    });
  });

  it("ne garde que le premier titre de chaque écriture", () => {
    expect(prefillFromParams({ titre: ["Sidi", "Mansour"] }).titleLatin).toBe("Sidi");
  });
});

describe("contributeHref", () => {
  it("met les titres et les artistes saisis dans l'adresse", () => {
    expect(contributeHref({ titleAr: "", titleLatin: "Sidi Mansour", artists: ["Saber Rebai", ""] })).toBe(
      "/contribuer?titre=Sidi+Mansour&artiste=Saber+Rebai",
    );
    expect(contributeHref({ titleAr: "", titleLatin: " ", artists: [] })).toBe("/contribuer");
  });

  it("se relit avec prefillFromParams", () => {
    const values = { titleAr: "سيدي منصور", titleLatin: "Sidi Mansour", artists: ["Saber Rebai", "لطفي بوشناق"] };
    const params = new URLSearchParams(contributeHref(values).split("?")[1]);
    expect(prefillFromParams({ titre: params.getAll("titre"), artiste: params.getAll("artiste") })).toEqual(values);
  });
});
