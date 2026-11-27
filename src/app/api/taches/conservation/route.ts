// Durées de conservation (politique de confidentialité, « Combien de temps ») : tâche lancée chaque nuit
// par Vercel (`crons` dans vercel.json). Le journal ne porte que des nombres, jamais d'adresse ni d'identifiant.
import { db } from "@/lib/db/client";
import { cronAuthorization } from "@/lib/retention/cronAuth";
import { runRetention } from "@/lib/retention/retention";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

export async function GET(request: Request): Promise<Response> {
  const auth = cronAuthorization(request.headers.get("authorization"), process.env.CRON_SECRET);
  if (auth === "unconfigured") {
    console.error(JSON.stringify({ level: "error", event: "retention_unconfigured", reason: "CRON_SECRET manque ou fait moins de 32 caractères" }));
    return Response.json({ status: "unconfigured" }, { status: 503, headers: { "cache-control": "no-store" } });
  }
  if (auth === "denied") return new Response(null, { status: 401, headers: { "cache-control": "no-store" } });

  const result = await runRetention(db);
  console.info(JSON.stringify({ level: "info", event: "retention", ...result }));
  return Response.json({ status: "ok", ...result }, { headers: { "cache-control": "no-store" } });
}
