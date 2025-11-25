import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { verifyApiKey, jsonResponse, errorResponse } from "@/lib/api-auth";
import { WEBHOOK_EVENTS, generateWebhookSecret } from "@/lib/webhooks";
import { z } from "zod";

// Schéma de validation pour créer un webhook
const createWebhookSchema = z.object({
  url: z.string().url("Invalid URL"),
  events: z
    .array(z.enum(WEBHOOK_EVENTS as unknown as [string, ...string[]]))
    .min(1, "At least one event is required"),
  secret: z.string().min(16).optional(),
});

/**
 * GET /api/v1/webhooks
 * Liste les webhooks de l'utilisateur
 */
export async function GET(request: NextRequest) {
  const user = await verifyApiKey(request);
  if (!user) {
    return errorResponse("Unauthorized - Invalid or missing API key", 401);
  }

  const webhooks = await db.webhook.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      url: true,
      events: true,
      active: true,
      createdAt: true,
      updatedAt: true,
      // Ne pas exposer le secret complet
    },
  });

  // Formater la réponse
  const formattedWebhooks = webhooks.map((w) => ({
    id: w.id,
    url: w.url,
    events: w.events,
    active: w.active,
    created_at: w.createdAt.toISOString(),
    updated_at: w.updatedAt.toISOString(),
  }));

  return jsonResponse({
    data: formattedWebhooks,
    available_events: WEBHOOK_EVENTS,
  });
}

/**
 * POST /api/v1/webhooks
 * Crée un nouveau webhook
 */
export async function POST(request: NextRequest) {
  const user = await verifyApiKey(request);
  if (!user) {
    return errorResponse("Unauthorized - Invalid or missing API key", 401);
  }

  try {
    const body = await request.json();

    // Valider les données
    const validated = createWebhookSchema.safeParse(body);
    if (!validated.success) {
      return errorResponse(
        validated.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join(", "),
        400
      );
    }

    const { url, events, secret } = validated.data;

    // Générer un secret si non fourni
    const webhookSecret = secret || generateWebhookSecret();

    // Créer le webhook
    const webhook = await db.webhook.create({
      data: {
        userId: user.id,
        url,
        events,
        secret: webhookSecret,
      },
    });

    return jsonResponse(
      {
        data: {
          id: webhook.id,
          url: webhook.url,
          events: webhook.events,
          active: webhook.active,
          // Exposer le secret uniquement à la création
          secret: webhookSecret,
          created_at: webhook.createdAt.toISOString(),
        },
        message: "Webhook created. Save the secret - it won't be shown again.",
      },
      201
    );
  } catch (error) {
    console.error("API Error:", error);
    return errorResponse(
      error instanceof Error ? error.message : "Internal server error",
      500
    );
  }
}
