import type { NameError } from "@/app/actions/clubs";
import { CLUB_NAME_MAX } from "@/lib/clubs/name";

type Translate = (key: "errors.required" | "errors.tooLong", values?: { max: string }) => string;

/** Message d'erreur d'un nom (club ou playlist), dans l'espace de noms `clubs`. */
export const nameErrorMessage = (t: Translate, error: NameError) =>
  error === "tooLong" ? t("errors.tooLong", { max: String(CLUB_NAME_MAX) }) : t("errors.required");
