import { describe, expect, it } from "vitest";
import { isPublicAuthPath } from "@/lib/auth/publicRoutes";

/** Comme la route : le chemin vient de `new URL(request.url).pathname`, qui résout les `..`. */
const allowed = (method: string, url: string) => isPublicAuthPath(method, new URL(url, "http://localhost:3000").pathname);

describe("isPublicAuthPath", () => {
  it("laisse passer les routes nécessaires au navigateur", () => {
    expect(allowed("GET", "/api/auth/magic-link/verify?token=abc")).toBe(true);
    expect(allowed("GET", "/api/auth/callback/google?code=x")).toBe(true);
    expect(allowed("POST", "/api/auth/callback/apple")).toBe(true);
    expect(allowed("GET", "/api/auth/get-session")).toBe(true);
    expect(allowed("POST", "/api/auth/sign-out")).toBe(true);
    expect(allowed("GET", "/api/auth/error?error=INVALID_TOKEN")).toBe(true);
    expect(allowed("GET", "/api/auth/ok")).toBe(true);
  });

  it("refuse le reste, dont la demande de lien qui contournerait la limite en base", () => {
    expect(allowed("POST", "/api/auth/sign-in/magic-link")).toBe(false);
    expect(allowed("POST", "/api/auth/update-user")).toBe(false);
    expect(allowed("POST", "/api/auth/delete-user")).toBe(false);
    expect(allowed("GET", "/api/auth/delete-user")).toBe(false);
    expect(allowed("POST", "/api/auth/sign-in/social")).toBe(false);
  });

  it("refuse une méthode qui n'est pas prévue pour la route", () => {
    expect(allowed("POST", "/api/auth/magic-link/verify")).toBe(false);
    expect(allowed("GET", "/api/auth/sign-out")).toBe(false);
    expect(allowed("POST", "/api/auth/get-session")).toBe(false);
  });

  it("ne se laisse pas tromper par un chemin détourné", () => {
    expect(allowed("POST", "/api/auth/magic-link/verify/../update-user")).toBe(false);
    expect(allowed("GET", "/api/auth/magic-link/verify/../../auth/delete-user")).toBe(false);
    expect(allowed("GET", "/api/auth/callback/")).toBe(false);
    expect(allowed("GET", "/api/auth/callback/google/extra")).toBe(false);
    expect(allowed("GET", "/api/auth/get-session/")).toBe(false);
  });
});
