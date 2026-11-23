import { describe, expect, it } from "vitest";
import { fakeGenerator, fakeTranslit } from "@/lib/translit/fake";

describe("fakeTranslit", () => {
  it("transcrit lettre à lettre, sans les signes diacritiques", () => {
    expect(fakeTranslit("سيدي منصور")).toBe("sidi mnsour");
    expect(fakeTranslit("أغنّي")).toBe("aghni");
    expect(fakeTranslit("عيني")).toBe("3ini");
  });

  it("garde les lignes et les lignes vides à leur place", () => {
    expect(fakeTranslit("الليل والذكريات\n\nرجعت")).toBe("allil oualdhkriat\n\nrj3t");
  });

  it("sert de générateur", async () => {
    await expect(fakeGenerator({ lyrics: "عيني", dialect: "tn" }, new AbortController().signal)).resolves.toBe("3ini");
  });
});
