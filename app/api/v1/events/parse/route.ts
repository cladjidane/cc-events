import { NextRequest } from "next/server";
import { parseEventBrief } from "@/lib/ai-parser";
import { jsonResponse, errorResponse } from "@/lib/api-auth";
import { z } from "zod";

const parseSchema = z.object({
  brief: z.string().min(10, "Le brief doit faire au moins 10 caractères"),
});

// Rate limiting simple en mémoire (à remplacer par Redis en prod si besoin)
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT = 10; // requêtes
const RATE_WINDOW = 60 * 1000; // par minute

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const record = rateLimitMap.get(ip);

  if (!record || now > record.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_WINDOW });
    return true;
  }

  if (record.count >= RATE_LIMIT) {
    return false;
  }

  record.count++;
  return true;
}

/**
 * POST /api/v1/events/parse
 * Parse un brief en texte libre et retourne les données structurées pour un événement
 * Endpoint public avec rate limiting
 */
export async function POST(request: NextRequest) {
  // Rate limiting par IP
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0] ||
    request.headers.get("x-real-ip") ||
    "unknown";

  if (!checkRateLimit(ip)) {
    return errorResponse("Trop de requêtes. Réessayez dans une minute.", 429);
  }

  // Vérifier que GROQ_API_KEY est configurée
  if (!process.env.GROQ_API_KEY) {
    return errorResponse("Service IA non configuré", 503);
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return errorResponse("JSON invalide", 400);
  }

  const validation = parseSchema.safeParse(body);
  if (!validation.success) {
    return errorResponse(validation.error.issues[0].message, 400);
  }

  const { brief } = validation.data;

  try {
    const parsed = await parseEventBrief(brief);

    return jsonResponse({
      data: {
        parsed,
        original_brief: brief,
      },
    });
  } catch (error) {
    console.error("Erreur parsing brief:", error);

    if (error instanceof SyntaxError) {
      return errorResponse(
        "Le modèle n'a pas retourné un JSON valide. Réessayez avec un brief plus clair.",
        422
      );
    }

    return errorResponse(
      "Erreur lors de l'analyse du brief. Réessayez.",
      500
    );
  }
}
