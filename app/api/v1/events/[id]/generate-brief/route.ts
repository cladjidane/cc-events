import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { generateBriefFromEvent } from "@/lib/ai-parser";
import { jsonResponse, errorResponse } from "@/lib/api-auth";

type RouteContext = {
  params: Promise<{ id: string }>;
};

/**
 * POST /api/v1/events/{id}/generate-brief
 * Génère un brief en langage naturel à partir des données d'un événement
 * Requiert authentification via session
 */
export async function POST(request: NextRequest, context: RouteContext) {
  const session = await auth();
  if (!session?.user) {
    return errorResponse("Non autorisé", 401);
  }
  const user = session.user;

  // Vérifier que GROQ_API_KEY est configurée
  if (!process.env.GROQ_API_KEY) {
    return errorResponse("Service IA non configuré", 503);
  }

  const { id } = await context.params;

  const event = await db.event.findUnique({
    where: { id },
    select: {
      id: true,
      title: true,
      subtitle: true,
      description: true,
      mode: true,
      location: true,
      startAt: true,
      endAt: true,
      capacity: true,
      organizerId: true,
    },
  });

  if (!event) {
    return errorResponse("Événement non trouvé", 404);
  }

  // Vérifier que l'utilisateur est propriétaire ou admin
  if (event.organizerId !== user.id && user.role !== "ADMIN") {
    return errorResponse("Non autorisé", 403);
  }

  try {
    const brief = await generateBriefFromEvent(event);

    return jsonResponse({
      data: {
        brief,
        eventId: event.id,
      },
    });
  } catch (error) {
    console.error("Erreur génération brief:", error);
    return errorResponse("Erreur lors de la génération du brief", 500);
  }
}
