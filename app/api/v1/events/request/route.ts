import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { jsonResponse, errorResponse } from "@/lib/api-auth";
import { sendEmail } from "@/lib/email";
import { EventApprovalEmail } from "@/emails/event-approval";
import { z } from "zod";

const requestSchema = z.object({
  email: z.string().email("Email invalide"),
  title: z.string().min(3, "Le titre doit faire au moins 3 caractères"),
  subtitle: z.string().optional(),
  description: z.string().optional(),
  mode: z.enum(["IN_PERSON", "ONLINE"]),
  location: z.string().optional(),
  startAt: z.string().refine((val) => !isNaN(Date.parse(val)), "Date de début invalide"),
  endAt: z.string().optional(),
  capacity: z.number().int().positive().optional(),
});

// Rate limiting simple
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT = 5; // requêtes
const RATE_WINDOW = 60 * 60 * 1000; // par heure

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
 * POST /api/v1/events/request
 * Crée une demande d'événement en attente de validation par email
 * Endpoint public avec rate limiting
 */
export async function POST(request: NextRequest) {
  // Rate limiting par IP
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0] ||
    request.headers.get("x-real-ip") ||
    "unknown";

  if (!checkRateLimit(ip)) {
    return errorResponse(
      "Trop de demandes. Réessayez plus tard.",
      429
    );
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return errorResponse("JSON invalide", 400);
  }

  const validation = requestSchema.safeParse(body);
  if (!validation.success) {
    return errorResponse(validation.error.issues[0].message, 400);
  }

  const data = validation.data;

  // Vérifier que l'utilisateur existe
  const user = await db.user.findUnique({
    where: { email: data.email },
  });

  if (!user) {
    return errorResponse(
      "Aucun compte n'existe avec cet email. Veuillez d'abord créer un compte sur la plateforme.",
      404
    );
  }

  // Parser les dates
  const startAt = new Date(data.startAt);
  const endAt = data.endAt ? new Date(data.endAt) : null;

  // Expiration du token : 24h
  const approvalExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);

  try {
    // Créer le PendingEvent
    const pendingEvent = await db.pendingEvent.create({
      data: {
        email: data.email,
        title: data.title,
        subtitle: data.subtitle,
        description: data.description,
        mode: data.mode,
        location: data.location,
        startAt,
        endAt,
        capacity: data.capacity,
        approvalExpires,
      },
    });

    // Construire les URLs
    const host = request.headers.get("host") || "localhost:3333";
    const protocol = host.includes("localhost") ? "http" : "https";
    const baseUrl = `${protocol}://${host}`;

    const approvePublishUrl = `${baseUrl}/approve/${pendingEvent.approvalToken}?action=publish`;
    const approveDraftUrl = `${baseUrl}/approve/${pendingEvent.approvalToken}?action=draft`;
    const rejectUrl = `${baseUrl}/approve/${pendingEvent.approvalToken}?action=reject`;

    // Formatter la date pour l'email
    const eventDate = startAt.toLocaleString("fr-FR", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

    // Envoyer l'email
    await sendEmail({
      to: data.email,
      subject: `Validez votre événement : ${data.title}`,
      react: EventApprovalEmail({
        eventTitle: data.title,
        eventDate,
        eventLocation: data.location,
        eventDescription: data.description,
        isOnline: data.mode === "ONLINE",
        capacity: data.capacity,
        approvePublishUrl,
        approveDraftUrl,
        rejectUrl,
      }),
    });

    return jsonResponse(
      {
        data: {
          message: "Demande créée. Un email de validation a été envoyé.",
          pending_id: pendingEvent.id,
        },
      },
      201
    );
  } catch (error) {
    console.error("Erreur création demande:", error);
    return errorResponse("Erreur lors de la création de la demande", 500);
  }
}
