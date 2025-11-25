import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { verifyApiKey, jsonResponse, errorResponse } from "@/lib/api-auth";
import { sendTestWebhook } from "@/lib/webhooks";

type Params = {
  params: Promise<{ id: string }>;
};

/**
 * POST /api/v1/webhooks/:id/test
 * Envoie un ping de test à un webhook
 */
export async function POST(request: NextRequest, { params }: Params) {
  const user = await verifyApiKey(request);
  if (!user) {
    return errorResponse("Unauthorized - Invalid or missing API key", 401);
  }

  const { id } = await params;

  // Vérifier que le webhook existe et appartient à l'utilisateur
  const webhook = await db.webhook.findFirst({
    where: {
      id,
      userId: user.id,
    },
  });

  if (!webhook) {
    return errorResponse("Webhook not found", 404);
  }

  // Envoyer le test
  const result = await sendTestWebhook(id);

  return jsonResponse({
    data: {
      success: result.success,
      url: result.url,
      status_code: result.statusCode,
      error: result.error,
      duration_ms: result.duration,
    },
  });
}
