"use server";

import { signIn, signOut } from "@/lib/auth";
import { loginSchema } from "@/lib/validations";
import { AuthError } from "next-auth";
import type { ActionResult } from "@/lib/utils";

export async function login(
  _prevState: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  const rawData = {
    email: formData.get("email"),
    password: formData.get("password"),
  };

  const validated = loginSchema.safeParse(rawData);

  if (!validated.success) {
    return {
      success: false,
      error: validated.error.issues[0]?.message || "Données invalides",
    };
  }

  try {
    await signIn("credentials", {
      email: validated.data.email,
      password: validated.data.password,
      redirectTo: "/dashboard",
    });

    return { success: true };
  } catch (error) {
    if (error instanceof AuthError) {
      switch (error.type) {
        case "CredentialsSignin":
          return { success: false, error: "Email ou mot de passe incorrect" };
        default:
          return { success: false, error: "Une erreur est survenue" };
      }
    }
    // Next.js redirect lance une erreur NEXT_REDIRECT qu'on doit laisser passer
    throw error;
  }
}

export async function logout() {
  await signOut({ redirectTo: "/" });
}
