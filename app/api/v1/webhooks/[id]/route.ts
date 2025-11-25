import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { verifyApiKey, jsonResponse, errorResponse } from "@/lib/api-auth";
import { WEBHOOK_EVENTS } from "@/lib/webhooks";
import { z } from "zod";

type Params = {
  params: Promise<{ id: string }>;
};

// Schéma de validation pour mise à jour
const updateWebhookSchema = z.object({
  url: z.string().url("Invalid URL").optional(),
  events: z
    .array(z.enum(WEBHOOK_EVENTS as unknown as [string, ...string[]]))
    .min(1)
    .optional(),
  active: z.boolean().optional(),
  secret: z.string().min(16).optional(),
});

/**
 * GET /api/v1/webhooks/:id
 * Récupère un webhook par son ID
 */
export async function GET(request: NextRequest, { params }: Params) {
  const user = await verifyApiKey(request);
  if (!user) {
    return errorResponse("Unauthorized - Invalid or missing API key", 401);
  }

  const { id } = await params;

  const webhook = await db.webhook.findFirst({
    where: {
      id,
      userId: user.id,
    },
  });

  if (!webhook) {
    return errorResponse("Webhook not found", 404);
  }

  return jsonResponse({
    data: {
      id: webhook.id,
      url: webhook.url,
      events: webhook.events,
      active: webhook.active,
      created_at: webhook.createdAt.toISOString(),
      updated_at: webhook.updatedAt.toISOString(),
    },
  });
}

/**
 * PATCH /api/v1/webhooks/:id
 * Met à jour un webhook
 */
export async function PATCH(request: NextRequest, { params }: Params) {
  const user = await verifyApiKey(request);
  if (!user) {
    return errorResponse("Unauthorized - Invalid or missing API key", 401);
  }

  const { id } = await params;

  // Vérifier que le webhook existe et appartient à l'utilisateur
  const existingWebhook = await db.webhook.findFirst({
    where: {
      id,
      userId: user.id,
    },
  });

  if (!existingWebhook) {
    return errorResponse("Webhook not found", 404);
  }

  try {
    const body = await request.json();

    // Valider les données
    const validated = updateWebhookSchema.safeParse(body);
    if (!validated.success) {
      return errorResponse(
        validated.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join(", "),
        400
      );
    }

    const { url, events, active, secret } = validated.data;

    // Mettre à jour
    const webhook = await db.webhook.update({
      where: { id },
      data: {
        ...(url && { url }),
        ...(events && { events }),
        ...(active !== undefined && { active }),
        ...(secret && { secret }),
      },
    });

    return jsonResponse({
      data: {
        id: webhook.id,
        url: webhook.url,
        events: webhook.events,
        active: webhook.active,
        created_at: webhook.createdAt.toISOString(),
        updated_at: webhook.updatedAt.toISOString(),
      },
    });
  } catch (error) {
    console.error("API Error:", error);
    return errorResponse(
      error instanceof Error ? error.message : "Internal server error",
      500
    );
  }
}

/**
 * DELETE /api/v1/webhooks/:id
 * Supprime un webhook
 */
export async function DELETE(request: NextRequest, { params }: Params) {
  const user = await verifyApiKey(request);
  if (!user) {
    return errorResponse("Unauthorized - Invalid or missing API key", 401);
  }

  const { id } = await params;

  // Vérifier que le webhook existe et appartient à l'utilisateur
  const existingWebhook = await db.webhook.findFirst({
    where: {
      id,
      userId: user.id,
    },
  });

  if (!existingWebhook) {
    return errorResponse("Webhook not found", 404);
  }

  await db.webhook.delete({ where: { id } });

  return jsonResponse({ message: "Webhook deleted successfully" });
}
