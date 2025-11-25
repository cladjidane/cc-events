import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { verifyApiKey, jsonResponse, errorResponse } from "@/lib/api-auth";
import { sendEmail } from "@/lib/email";
import { CustomNotificationEmail } from "@/emails/custom-notification";
import { formatDateRange } from "@/lib/utils";
import { RegistrationStatus } from "@prisma/client";
import { z } from "zod";

type Params = {
  params: Promise<{ id: string }>;
};

// Schéma de validation pour l'envoi de notification
const notifySchema = z.object({
  subject: z.string().min(1, "Subject is required").max(200),
  message: z.string().min(1, "Message is required").max(5000),
  target: z.enum(["all", "confirmed", "waitlist"]).default("all"),
  includeEventDetails: z.boolean().default(true),
});

/**
 * POST /api/v1/events/:id/notify
 * Envoie une notification par email aux inscrits
 */
export async function POST(request: NextRequest, { params }: Params) {
  const user = await verifyApiKey(request);
  if (!user) {
    return errorResponse("Unauthorized - Invalid or missing API key", 401);
  }

  const { id } = await params;
  const searchParams = request.nextUrl.searchParams;
  const isPreview = searchParams.get("preview") === "true";

  // Vérifier que l'événement existe et appartient à l'utilisateur
  const event = await db.event.findFirst({
    where: {
      OR: [{ id }, { slug: id }],
      ...(user.role !== "ADMIN" && { organizerId: user.id }),
    },
  });

  if (!event) {
    return errorResponse("Event not found", 404);
  }

  try {
    const body = await request.json();

    // Valider les données
    const validated = notifySchema.safeParse(body);
    if (!validated.success) {
      return errorResponse(
        validated.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join(", "),
        400
      );
    }

    const { subject, message, target, includeEventDetails } = validated.data;

    // Construire le filtre selon la cible
    const statusFilter: RegistrationStatus[] = [];
    if (target === "all" || target === "confirmed") {
      statusFilter.push(RegistrationStatus.CONFIRMED);
    }
    if (target === "all" || target === "waitlist") {
      statusFilter.push(RegistrationStatus.WAITLIST);
    }

    // Récupérer les inscriptions ciblées
    const registrations = await db.registration.findMany({
      where: {
        eventId: event.id,
        status: { in: statusFilter },
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        cancelToken: true,
      },
    });

    if (registrations.length === 0) {
      return errorResponse("No recipients found for the specified target", 400);
    }

    // Mode preview : retourner un aperçu sans envoyer
    if (isPreview) {
      const appUrl = process.env.APP_URL || "http://localhost:3000";
      const sampleRecipient = registrations[0];

      return jsonResponse({
        data: {
          preview: true,
          recipients_count: registrations.length,
          target,
          sample: {
            to: sampleRecipient.email,
            subject,
            firstName: sampleRecipient.firstName,
            message,
            includeEventDetails,
            event: includeEventDetails
              ? {
                  title: event.title,
                  date: formatDateRange(event.startAt, event.endAt),
                  location: event.location,
                  url: `${appUrl}/e/${event.slug}`,
                }
              : null,
          },
        },
      });
    }

    // Envoyer les emails
    const appUrl = process.env.APP_URL || "http://localhost:3000";
    const results: { email: string; status: "sent" | "failed"; error?: string }[] = [];

    // Envoi séquentiel pour éviter de surcharger le serveur SMTP
    for (const registration of registrations) {
      try {
        await sendEmail({
          to: registration.email,
          subject,
          react: CustomNotificationEmail({
            firstName: registration.firstName,
            subject,
            message,
            eventTitle: includeEventDetails ? event.title : undefined,
            eventDate: includeEventDetails
              ? formatDateRange(event.startAt, event.endAt)
              : undefined,
            eventLocation: includeEventDetails ? event.location || undefined : undefined,
            isOnline: event.mode === "ONLINE",
            eventUrl: `${appUrl}/e/${event.slug}`,
            cancelUrl: `${appUrl}/cancel/${registration.cancelToken}`,
            includeEventDetails,
          }),
        });

        results.push({ email: registration.email, status: "sent" });
      } catch (error) {
        results.push({
          email: registration.email,
          status: "failed",
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }

    const sent = results.filter((r) => r.status === "sent").length;
    const failed = results.filter((r) => r.status === "failed").length;

    return jsonResponse({
      data: {
        sent,
        failed,
        target,
        total: registrations.length,
        details: results,
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
