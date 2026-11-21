import { toNextJsHandler } from "better-auth/next-js";
import { getAuth } from "@/lib/auth/auth";
import { isPublicAuthPath } from "@/lib/auth/publicRoutes";

// Routes de Better Auth : vérification du lien magique, retour de Google, session, déconnexion.
// Seules celles de la liste blanche (`isPublicAuthPath`) sont servies ; les autres répondent 404.
let handler: ReturnType<typeof toNextJsHandler> | undefined;
const authHandler = () => (handler ??= toNextJsHandler(getAuth()));

const notFound = () => new Response("Not Found", { status: 404 });

export function GET(request: Request) {
  if (!isPublicAuthPath("GET", new URL(request.url).pathname)) return notFound();
  return authHandler().GET(request);
}

export function POST(request: Request) {
  if (!isPublicAuthPath("POST", new URL(request.url).pathname)) return notFound();
  return authHandler().POST(request);
}
