"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { DEMO_SESSION_COOKIE, isDemoSession } from "@/mocks/session";

/** MAQUETTE : change le cas de démonstration (membre, membre sans club, visiteur). */
export async function setDemoSession(formData: FormData): Promise<void> {
  if (process.env.NODE_ENV === "production") return;
  const value = formData.get("session");
  if (typeof value !== "string" || !isDemoSession(value)) return;
  (await cookies()).set(DEMO_SESSION_COOKIE, value, { path: "/", sameSite: "lax" });
  revalidatePath("/", "layout");
}
