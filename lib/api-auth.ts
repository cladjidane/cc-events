import { NextRequest } from "next/server";
import { db } from "@/lib/db";

export type ApiUser = {
  id: string;
  email: string;
  name: string | null;
  role: "ADMIN" | "ORGANIZER";
};

/**
 * Vérifie l'authentification API via header Authorization: Bearer <API_KEY>
 * L'API Key est le NEXTAUTH_SECRET + user email encodé en base64
 * Format: base64(email:NEXTAUTH_SECRET)
 */
export async function verifyApiKey(request: NextRequest): Promise<ApiUser | null> {
  const authHeader = request.headers.get("Authorization");

  if (!authHeader?.startsWith("Bearer ")) {
    return null;
  }

  const apiKey = authHeader.slice(7);

  try {
    // Décoder l'API key (format: base64(email:secret))
    const decoded = Buffer.from(apiKey, "base64").toString("utf-8");
    const [email, secret] = decoded.split(":");

    // Vérifier le secret
    if (secret !== process.env.NEXTAUTH_SECRET) {
      return null;
    }

    // Récupérer l'utilisateur
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
