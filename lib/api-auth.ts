import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { createHash } from "crypto";

export type ApiUser = {
  id: string;
  email: string;
  name: string | null;
  role: "ADMIN" | "ORGANIZER";
};

// Hasher le token pour comparaison
function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

/**
 * Vérifie l'authentification API via header Authorization: Bearer <API_KEY>
 * L'API Key est un token généré via /dashboard/settings
 * Format: evl_xxxxxxxxxxxxxxxxxxxxxxxxxxxx
 */
export async function verifyApiKey(request: NextRequest): Promise<ApiUser | null> {
  const authHeader = request.headers.get("Authorization");

  if (!authHeader?.startsWith("Bearer ")) {
    return null;
  }

  const token = authHeader.slice(7);

  // Vérifier le format du token
  if (!token.startsWith("evl_")) {
    // Fallback temporaire pour l'ancien format base64 (à retirer plus tard)
    return verifyLegacyApiKey(token);
  }

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

    return apiKey.user as ApiUser;
  } catch {
    return null;
  }
}

/**
 * Fallback pour l'ancien format base64(email:secret)
 * À RETIRER une fois la migration terminée
 */
async function verifyLegacyApiKey(apiKey: string): Promise<ApiUser | null> {
  try {
    const decoded = Buffer.from(apiKey, "base64").toString("utf-8");
    const [email, secret] = decoded.split(":");

    if (secret !== process.env.NEXTAUTH_SECRET) {
      return null;
    }

    const user = await db.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
      },
    });

    if (!user) {
      return null;
    }

    return user as ApiUser;
  } catch {
    return null;
  }
}

/**
 * Helper pour créer une réponse JSON avec le bon status
 */
export function jsonResponse(data: unknown, status = 200) {
  return Response.json(data, { status });
}

/**
 * Helper pour créer une réponse d'erreur
 */
export function errorResponse(message: string, status = 400) {
  return Response.json({ error: message }, { status });
}
