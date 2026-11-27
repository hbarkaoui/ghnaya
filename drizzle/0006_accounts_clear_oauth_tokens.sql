-- Minimisation (relecture juridique du 27/11/2026) : les jetons Google ne servent qu'à la connexion.
-- Les nouvelles écritures les vident déjà (databaseHooks.account dans lib/auth/auth.ts) ; on efface ici
-- ceux enregistrés avant. Le compte Google reste lié par son identifiant (account_id).
UPDATE "accounts" SET
  "access_token" = NULL,
  "refresh_token" = NULL,
  "id_token" = NULL,
  "access_token_expires_at" = NULL,
  "refresh_token_expires_at" = NULL
WHERE "access_token" IS NOT NULL
  OR "refresh_token" IS NOT NULL
  OR "id_token" IS NOT NULL
  OR "access_token_expires_at" IS NOT NULL
  OR "refresh_token_expires_at" IS NOT NULL;
