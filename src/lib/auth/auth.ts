import "server-only";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { APIError } from "better-auth/api";
import { nextCookies } from "better-auth/next-js";
import { magicLink } from "better-auth/plugins";
import { db } from "@/lib/db/client";
import * as schema from "@/lib/db/schema";
import { magicLinkEmail } from "@/lib/mail/magicLinkEmail";
import { sendMail } from "@/lib/mail/transport";
import { defaultNameFromEmail, normalizeUserName } from "./name";

/**
 * Comptes et sessions (plan 2, tâche 3). Sessions en base (tables `sessions`, `accounts`, `verifications`),
 * identifiants UUID générés par PostgreSQL. Connexion par lien magique et, si configuré, par Google.
 * Le compte est créé à la première connexion (spec §4.1).
 */
export const MAGIC_LINK_TTL_SECONDS = 15 * 60;

export const isGoogleEnabled = (): boolean =>
  Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);

const createAuth = () =>
  betterAuth({
    baseURL: process.env.BETTER_AUTH_URL,
    secret: process.env.BETTER_AUTH_SECRET,
    database: drizzleAdapter(db, { provider: "pg", schema, usePlural: true }),
    advanced: { database: { generateId: "uuid" } },
    user: {
      // Champs gérés par le serveur seulement (`input: false`) : ni l'inscription ni la mise à jour du profil
      // ne peuvent les fixer. Les rôles changent par `pnpm user:role`.
      additionalFields: {
        globalRole: { type: ["member", "moderator", "admin"], required: false, defaultValue: "member", input: false },
        isAnimator: { type: "boolean", required: false, defaultValue: false, input: false },
        locale: { type: ["fr", "ar"], required: false, defaultValue: "fr", input: false },
      },
    },
    socialProviders: isGoogleEnabled()
      ? { google: { clientId: process.env.GOOGLE_CLIENT_ID!, clientSecret: process.env.GOOGLE_CLIENT_SECRET! } }
      : {},
    databaseHooks: {
      user: {
        create: {
          // Lien magique : Better Auth crée le compte avec un nom vide, ou celui du corps de la demande (écart 3).
          // Un nom absent ou invalide est remplacé par celui tiré de l'adresse.
          before: async (user) => {
            const check = normalizeUserName(user.name);
            return { data: { ...user, name: check.ok ? check.name : defaultNameFromEmail(user.email) } };
          },
        },
        update: {
          // Même règle que `lib/account` : un nom invalide est refusé, un nom valide est écrit nettoyé.
          before: async (data) => {
            if (!("name" in data)) return;
            const check = normalizeUserName(data.name);
            if (!check.ok) throw new APIError("BAD_REQUEST", { message: `Invalid user name: ${check.error}` });
            return { data: { ...data, name: check.name } };
          },
        },
      },
    },
    plugins: [
      magicLink({
        expiresIn: MAGIC_LINK_TTL_SECONDS,
        // En base, le jeton est haché : une fuite de la table `verifications` ne donne aucun lien valable.
        storeToken: "hashed",
        sendMagicLink: async ({ email, url, metadata }) => {
          const locale = metadata?.locale === "ar" ? "ar" : "fr";
          await sendMail({ to: email, ...magicLinkEmail({ url, locale }), link: url });
        },
      }),
      // En dernier (documentation de Better Auth) : pose les cookies de session depuis les Server Actions.
      nextCookies(),
    ],
  });

let instance: ReturnType<typeof createAuth> | undefined;

/**
 * Instance créée au premier usage, et non à l'import : Better Auth s'initialise tout de suite et refuse,
 * en production, de démarrer sans `BETTER_AUTH_SECRET`. Or `next build` charge ce module sans secret,
 * et l'image Docker de la CI sert l'accueil sans configuration.
 */
export const getAuth = () => (instance ??= createAuth());

export type AuthSession = ReturnType<typeof createAuth>["$Infer"]["Session"];
