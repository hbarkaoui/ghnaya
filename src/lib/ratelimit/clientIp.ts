// Plan 1, tâche 9 : adresse du client derrière le proxy de l'hébergeur (Vercel pose x-forwarded-for).
export function clientIp(headers: Headers): string {
  const forwarded = headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return forwarded || headers.get("x-real-ip")?.trim() || "unknown";
}
