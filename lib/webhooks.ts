import crypto from "crypto";
import { db } from "@/lib/db";

// Types d'événements webhook disponibles
export const WEBHOOK_EVENTS = [
  "registration.created",
  "registration.cancelled",
  "registration.promoted",
  "event.created",
  "event.updated",
  "event.published",
  "event.cancelled",
] as const;

export type WebhookEventType = (typeof WEBHOOK_EVENTS)[number];

// Payload envoyé aux webhooks
export interface WebhookPayload {
  id: string;
  event: WebhookEventType;
  timestamp: string;
  data: Record<string, unknown>;
}

// Résultat d'un envoi webhook
export interface WebhookDeliveryResult {
  webhookId: string;
  url: string;
  success: boolean;
  statusCode?: number;
  error?: string;
  duration: number;
}

/**
 * Génère une signature HMAC-SHA256 pour un payload
 */
export function signPayload(payload: string, secret: string): string {
  return crypto.createHmac("sha256", secret).update(payload).digest("hex");
}

/**
 * Vérifie une signature webhook
 */
export function verifySignature(
  payload: string,
  signature: string,
  secret: string
): boolean {
  const expectedSignature = `sha256=${signPayload(payload, secret)}`;
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  );
}

/**
 * Envoie un payload à un webhook
 */
async function deliverWebhook(
  webhookId: string,
  url: string,
  secret: string,
  payload: WebhookPayload
): Promise<WebhookDeliveryResult> {
  const startTime = Date.now();
  const payloadString = JSON.stringify(payload);
  const signature = `sha256=${signPayload(payloadString, secret)}`;

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-EventLite-Signature": signature,
        "X-EventLite-Event": payload.event,
        "X-EventLite-Delivery": payload.id,
      },
      body: payloadString,
      signal: AbortSignal.timeout(10000), // 10s timeout
    });

    const duration = Date.now() - startTime;

    return {
      webhookId,
      url,
      success: response.ok,
      statusCode: response.status,
      duration,
    };
  } catch (error) {
    const duration = Date.now() - startTime;

    return {
      webhookId,
      url,
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
      duration,
    };
  }
}

/**
 * Déclenche les webhooks pour un événement donné
 */
export async function triggerWebhooks(
  userId: string,
  eventType: WebhookEventType,
  data: Record<string, unknown>
): Promise<WebhookDeliveryResult[]> {
  // Récupérer les webhooks actifs de l'utilisateur qui écoutent cet événement
  const webhooks = await db.webhook.findMany({
    where: {
      userId,
      active: true,
      events: { has: eventType },
    },
  });

  if (webhooks.length === 0) {
    return [];
  }

  // Créer le payload
  const payload: WebhookPayload = {
    id: crypto.randomUUID(),
    event: eventType,
    timestamp: new Date().toISOString(),
    data,
  };

  // Envoyer à tous les webhooks en parallèle
  const results = await Promise.all(
    webhooks.map((webhook) =>
      deliverWebhook(webhook.id, webhook.url, webhook.secret, payload)
    )
  );

  // Logger les résultats
  for (const result of results) {
    if (result.success) {
      console.log(
        `[WEBHOOK] Delivered ${eventType} to ${result.url} (${result.duration}ms)`
      );
    } else {
      console.error(
        `[WEBHOOK] Failed ${eventType} to ${result.url}: ${result.error || `HTTP ${result.statusCode}`}`
      );
    }
  }

  return results;
}

/**
 * Envoie un ping de test à un webhook
 */
export async function sendTestWebhook(
  webhookId: string
): Promise<WebhookDeliveryResult> {
  const webhook = await db.webhook.findUnique({
    where: { id: webhookId },
  });

  if (!webhook) {
    return {
      webhookId,
      url: "",
      success: false,
      error: "Webhook not found",
      duration: 0,
    };
  }

  const payload: WebhookPayload = {
    id: crypto.randomUUID(),
    event: "event.created", // Utilise un événement réel pour le test
    timestamp: new Date().toISOString(),
    data: {
      test: true,
      message: "This is a test webhook delivery from EventLite",
    },
  };

  return deliverWebhook(webhook.id, webhook.url, webhook.secret, payload);
}

/**
 * Génère un secret aléatoire pour un webhook
 */
export function generateWebhookSecret(): string {
  return crypto.randomBytes(32).toString("hex");
}
