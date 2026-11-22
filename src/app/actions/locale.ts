"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { LOCALE_COOKIE } from "@/i18n/locale";
import { setUserLocale } from "@/lib/account/write";
import { db } from "@/lib/db/client";
import { getCurrentUser } from "@/lib/session";

export async function setLocale(formData: FormData): Promise<void> {
  const value = formData.get("locale");
  if (value !== "fr" && value !== "ar") return;
  (await cookies()).set(LOCALE_COOKIE, value, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
  });
  const user = await getCurrentUser();
  if (user) await setUserLocale(db, user.id, value);
  revalidatePath("/", "layout");
}
