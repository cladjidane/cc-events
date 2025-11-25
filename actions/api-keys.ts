"use server";

import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { randomBytes, createHash } from "crypto";
import { revalidatePath } from "next/cache";
import type { ActionResult } from "@/lib/utils";

// Générer un token aléatoire sécurisé
function generateToken(): string {
  return `evl_${randomBytes(24).toString("base64url")}`;
}

// Hasher le token pour stockage
function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

// Extraire le préfixe pour identification
function getPrefix(token: string): string {
  return token.slice(0, 12); // "evl_" + 8 chars
}

// Vérifier que l'utilisateur est connecté
async function requireAuth() {
  const session = await auth();
  if (!session?.user) {
    throw new Error("Non autorisé");
  }
  return session.user;
}

// Créer une nouvelle API key
export async function createApiKey(
  name: string
): Promise<ActionResult<{ token: string; prefix: string }>> {
  try {
    const user = await requireAuth();

    // Limiter le nombre de clés par utilisateur
    const existingKeys = await db.apiKey.count({
      where: { userId: user.id },
    });

    if (existingKeys >= 5) {
      return {
        success: false,
        error: "Maximum 5 clés API par utilisateur",
      };
    }

    // Générer le token
    const token = generateToken();
    const hashedKey = hashToken(token);
    const prefix = getPrefix(token);

    // Sauvegarder en DB (hashé)
    await db.apiKey.create({
      data: {
        userId: user.id,
        name: name || "API Key",
        key: hashedKey,
        prefix,
      },
    });

    revalidatePath("/dashboard/settings");

    // Retourner le token EN CLAIR (une seule fois !)
    return {
      success: true,
      data: { token, prefix },
    };
  } catch (error) {
    console.error("Erreur création API key:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Une erreur est survenue",
    };
  }
}

// Lister les API keys de l'utilisateur
export async function getApiKeys() {
  const session = await auth();
  if (!session?.user) return [];

  return db.apiKey.findMany({
    where: { userId: session.user.id },
    select: {
      id: true,
      name: true,
      prefix: true,
      lastUsedAt: true,
      expiresAt: true,
      createdAt: true,
    },
    orderBy: { createdAt: "desc" },
  });
}

// Supprimer une API key
export async function deleteApiKey(keyId: string): Promise<ActionResult> {
  try {
    const user = await requireAuth();

    const apiKey = await db.apiKey.findUnique({
      where: { id: keyId },
    });

    if (!apiKey) {
      return { success: false, error: "Clé introuvable" };
    }

    if (apiKey.userId !== user.id && user.role !== "ADMIN") {
      return { success: false, error: "Non autorisé" };
    }

    await db.apiKey.delete({ where: { id: keyId } });

    revalidatePath("/dashboard/settings");

    return { success: true };
  } catch (error) {
    console.error("Erreur suppression API key:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Une erreur est survenue",
    };
  }
}

// Valider une API key (utilisé par l'API)
export async function validateApiKey(token: string) {
  try {
    const hashedKey = hashToken(token);

    const apiKey = await db.apiKey.findUnique({
      where: { key: hashedKey },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            role: true,
          },
        },
      },
    });

    if (!apiKey) {
      return null;
    }

    // Vérifier expiration
    if (apiKey.expiresAt && apiKey.expiresAt < new Date()) {
      return null;
    }

    // Mettre à jour lastUsedAt (sans bloquer)
    db.apiKey.update({
      where: { id: apiKey.id },
      data: { lastUsedAt: new Date() },
    }).catch(() => {}); // Fire and forget

    return apiKey.user;
  } catch {
    return null;
  }
}
