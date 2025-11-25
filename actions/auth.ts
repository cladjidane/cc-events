"use server";

import { signIn, signOut } from "@/lib/auth";
import { db } from "@/lib/db";
import { loginSchema, registerSchema } from "@/lib/validations";
import { AuthError } from "next-auth";
import { hash } from "bcryptjs";
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

export async function register(
  _prevState: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  const rawData = {
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
  };

  const validated = registerSchema.safeParse(rawData);

  if (!validated.success) {
    return {
      success: false,
      error: validated.error.issues[0]?.message || "Données invalides",
    };
  }

  try {
    // Vérifier si l'email existe déjà
    const existingUser = await db.user.findUnique({
      where: { email: validated.data.email },
    });

    if (existingUser) {
      return { success: false, error: "Cet email est déjà utilisé" };
    }

    // Hasher le mot de passe et créer l'utilisateur
    const hashedPassword = await hash(validated.data.password, 12);

    await db.user.create({
      data: {
        name: validated.data.name,
        email: validated.data.email,
        password: hashedPassword,
        role: "ORGANIZER",
      },
    });

    // Connecter automatiquement l'utilisateur
    await signIn("credentials", {
      email: validated.data.email,
      password: validated.data.password,
      redirectTo: "/dashboard",
    });

    return { success: true };
  } catch (error) {
    if (error instanceof AuthError) {
      return { success: false, error: "Une erreur est survenue lors de la connexion" };
    }
    // Next.js redirect lance une erreur NEXT_REDIRECT qu'on doit laisser passer
    throw error;
  }
}
