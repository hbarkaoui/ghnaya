"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { LOCALE_COOKIE } from "@/i18n/locale";

export async function setLocale(formData: FormData): Promise<void> {
  const value = formData.get("locale");
  if (value !== "fr" && value !== "ar") return;
  (await cookies()).set(LOCALE_COOKIE, value, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
  });
  revalidatePath("/", "layout");
}
