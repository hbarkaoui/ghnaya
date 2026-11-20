import { describe, expect, it, vi } from "vitest";
import {
  ACTION_FAILED,
  actionFailureKind,
  errorDigest,
  keepStateOnFailure,
  settle,
} from "@/lib/system/actionFailure";

/** Les erreurs de fetch telles que les navigateurs les lèvent quand le réseau est coupé. */
const FETCH_ERRORS = [
  new TypeError("Failed to fetch"), // Chrome, Edge
  new TypeError("Load failed"), // Safari
  new TypeError("NetworkError when attempting to fetch resource."), // Firefox
  new TypeError("fetch failed"), // Node
  new TypeError("Network request failed"),
];

describe("actionFailureKind", () => {
  it("reconnaît un échec réseau, quel que soit le navigateur", () => {
    for (const error of FETCH_ERRORS) expect(actionFailureKind(error, true)).toBe("network");
  });

  it("classe tout échec en réseau quand le navigateur se sait hors ligne", () => {
    expect(actionFailureKind(new Error("An unexpected response was received from the server."), false)).toBe("network");
    expect(actionFailureKind("boom", false)).toBe("network");
  });

  it("classe une erreur du serveur ou une réponse inattendue en « server »", () => {
    const thrown = Object.assign(new Error("An error occurred in the Server Components render."), { digest: "2891234567" });
    expect(actionFailureKind(thrown, true)).toBe("server");
    expect(actionFailureKind(new Error("An unexpected response was received from the server."), true)).toBe("server");
  });

  it("ne prend pas une autre TypeError pour un échec réseau", () => {
    expect(actionFailureKind(new TypeError("Cannot read properties of undefined (reading 'id')"), true)).toBe("server");
  });

  it("accepte une valeur levée qui n'est pas une Error", () => {
    expect(actionFailureKind(undefined, true)).toBe("server");
    expect(actionFailureKind({ message: "Failed to fetch" }, true)).toBe("server");
  });
});

describe("errorDigest", () => {
  it("lit la référence d'une erreur venue du serveur", () => {
    expect(errorDigest(Object.assign(new Error("x"), { digest: "2891234567" }))).toBe("2891234567");
  });

  it("renvoie null sans référence exploitable", () => {
    expect(errorDigest(new Error("x"))).toBeNull();
    expect(errorDigest(Object.assign(new Error("x"), { digest: "" }))).toBeNull();
    expect(errorDigest(Object.assign(new Error("x"), { digest: 42 }))).toBeNull();
    expect(errorDigest("boom")).toBeNull();
    expect(errorDigest(null)).toBeNull();
  });

  it("ne garde que la référence, sans espaces autour", () => {
    expect(errorDigest({ digest: "  abc123  " })).toBe("abc123");
  });
});

describe("settle", () => {
  it("rend le résultat d'une action réussie sans signaler d'échec", async () => {
    const onFailure = vi.fn();
    await expect(settle(Promise.resolve({ status: "added" }), onFailure)).resolves.toEqual({ status: "added" });
    expect(onFailure).not.toHaveBeenCalled();
  });

  it("signale l'échec et rend ACTION_FAILED au lieu de rejeter", async () => {
    const error = new TypeError("Failed to fetch");
    const onFailure = vi.fn();
    await expect(settle(Promise.reject(error), onFailure)).resolves.toBe(ACTION_FAILED);
    expect(onFailure).toHaveBeenCalledWith(error);
  });

  it("laisse passer ce que onFailure relance (redirection, introuvable de Next.js)", async () => {
    const redirect = Object.assign(new Error("NEXT_REDIRECT"), { digest: "NEXT_REDIRECT;push;/moi;307;" });
    const onFailure = (error: unknown) => {
      throw error;
    };
    await expect(settle(Promise.reject(redirect), onFailure)).rejects.toBe(redirect);
  });
});

describe("keepStateOnFailure", () => {
  type State = { done: boolean; attempt: number } | null;

  it("rend le nouvel état d'une action réussie", async () => {
    const action = vi.fn(
      async (prev: State, payload: string): Promise<State> => ({ done: payload === "ok", attempt: (prev?.attempt ?? 0) + 1 }),
    );
    const guarded = keepStateOnFailure(action, vi.fn());
    await expect(guarded(null, "ok")).resolves.toEqual({ done: true, attempt: 1 });
    expect(action).toHaveBeenCalledWith(null, "ok");
  });

  it("garde l'état précédent après un échec, et le signale", async () => {
    const previous: State = { done: false, attempt: 3 };
    const error = new TypeError("Load failed");
    const onFailure = vi.fn();
    const guarded = keepStateOnFailure<State, string>(async () => {
      throw error;
    }, onFailure);
    await expect(guarded(previous, "x")).resolves.toBe(previous);
    expect(onFailure).toHaveBeenCalledWith(error);
  });

  it("laisse passer ce que onFailure relance", async () => {
    const notFound = Object.assign(new Error("NEXT_HTTP_ERROR_FALLBACK;404"), { digest: "NEXT_HTTP_ERROR_FALLBACK;404" });
    const guarded = keepStateOnFailure<State, string>(
      async () => {
        throw notFound;
      },
      (error) => {
        throw error;
      },
    );
    await expect(guarded(null, "x")).rejects.toBe(notFound);
  });
});
