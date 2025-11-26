import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { verifyApiKey, jsonResponse, errorResponse } from "@/lib/api-auth";
import { RegistrationStatus } from "@prisma/client";
import { z } from "zod";
import { sendEmail } from "@/lib/email";
import { WaitlistPromotedEmail } from "@/emails/waitlist-promoted";
import { CancellationConfirmationEmail } from "@/emails/cancellation-confirmation";
import { CancellationOrganizerEmail } from "@/emails/cancellation-organizer";
import { formatDateRange } from "@/lib/utils";
import { triggerWebhooks } from "@/lib/webhooks";

type Params = {
  params: Promise<{ id: string; email: string }>;
};

// Schéma de validation pour mise à jour
const updateRegistrationSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  notes: z.string().max(500).optional().nullable(),
  status: z.nativeEnum(RegistrationStatus).optional(),
});

/**
 * Trouver un événement par ID ou slug avec vérification d'accès
 */
async function findEventWithAccess(
  id: string,
  userId: string,
  userRole: string
) {
  return db.event.findFirst({
    where: {
      OR: [{ id }, { slug: id }],
      ...(userRole !== "ADMIN" && { organizerId: userId }),
    },
  });
}

/**
 * GET /api/v1/events/:id/registrations/:email
 * Récupère une inscription par email
 */
export async function GET(request: NextRequest, { params }: Params) {
  const user = await verifyApiKey(request);
  if (!user) {
    return errorResponse("Unauthorized - Invalid or missing API key", 401);
  }

  const { id, email } = await params;
  const decodedEmail = decodeURIComponent(email);

  // Vérifier l'événement
  const event = await findEventWithAccess(id, user.id, user.role);
  if (!event) {
    return errorResponse("Event not found", 404);
  }

  // Trouver l'inscription
  const registration = await db.registration.findUnique({
    where: {
      email_eventId: {
        email: decodedEmail,
        eventId: event.id,
      },
    },
  });

  if (!registration) {
    return errorResponse("Registration not found", 404);
  }

  return jsonResponse({
    data: {
      id: registration.id,
      email: registration.email,
      name: `${registration.firstName} ${registration.lastName}`,
      first_name: registration.firstName,
      last_name: registration.lastName,
      notes: registration.notes,
      status: registration.status,
      registered_at: registration.createdAt.toISOString(),
      updated_at: registration.updatedAt.toISOString(),
      event: {
        id: event.id,
        title: event.title,
        slug: event.slug,
      },
    },
  });
}

/**
 * PATCH /api/v1/events/:id/registrations/:email
 * Met à jour une inscription
 */
export async function PATCH(request: NextRequest, { params }: Params) {
  const user = await verifyApiKey(request);
  if (!user) {
    return errorResponse("Unauthorized - Invalid or missing API key", 401);
  }

  const { id, email } = await params;
  const decodedEmail = decodeURIComponent(email);

  // Vérifier l'événement avec infos organisateur
  const event = await db.event.findFirst({
    where: {
      OR: [{ id }, { slug: id }],
      ...(user.role !== "ADMIN" && { organizerId: user.id }),
    },
    include: {
      organizer: { select: { id: true, email: true, name: true } },
    },
  });
  if (!event) {
    return errorResponse("Event not found", 404);
  }

  // Trouver l'inscription
  const existingRegistration = await db.registration.findUnique({
    where: {
      email_eventId: {
        email: decodedEmail,
        eventId: event.id,
      },
    },
  });

  if (!existingRegistration) {
    return errorResponse("Registration not found", 404);
  }

  try {
    const body = await request.json();

    // Valider les données
    const validated = updateRegistrationSchema.safeParse(body);
    if (!validated.success) {
      return errorResponse(
        validated.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join(", "),
        400
      );
    }

    const { name, notes, status } = validated.data;

    // Préparer les données à mettre à jour
    const updateData: {
      firstName?: string;
      lastName?: string;
      notes?: string | null;
      status?: RegistrationStatus;
    } = {};

    if (name !== undefined) {
      const nameParts = name.trim().split(/\s+/);
      updateData.firstName = nameParts[0] || name;
      updateData.lastName = nameParts.slice(1).join(" ") || "-";
    }

    if (notes !== undefined) {
      updateData.notes = notes;
    }

    // Gestion du changement de statut
    if (status !== undefined && status !== existingRegistration.status) {
      // Si on passe de CONFIRMED à autre chose, promouvoir le premier en waitlist
      if (
        existingRegistration.status === RegistrationStatus.CONFIRMED &&
        status !== RegistrationStatus.CONFIRMED
      ) {
        await promoteFromWaitlist(event.id, event);
      }

      // Si on passe à CONFIRMED, vérifier la capacité
      if (status === RegistrationStatus.CONFIRMED) {
        const confirmedCount = await db.registration.count({
          where: {
            eventId: event.id,
            status: RegistrationStatus.CONFIRMED,
            id: { not: existingRegistration.id },
          },
        });

        if (event.capacity && confirmedCount >= event.capacity) {
          return errorResponse("Cannot confirm: event is at capacity", 400);
        }
      }

      updateData.status = status;
    }

    // Mettre à jour
    const registration = await db.registration.update({
      where: { id: existingRegistration.id },
      data: updateData,
    });

    return jsonResponse({
      data: {
        id: registration.id,
        email: registration.email,
        name: `${registration.firstName} ${registration.lastName}`,
        first_name: registration.firstName,
        last_name: registration.lastName,
        notes: registration.notes,
        status: registration.status,
        registered_at: registration.createdAt.toISOString(),
        updated_at: registration.updatedAt.toISOString(),
        event: {
          id: event.id,
          title: event.title,
          slug: event.slug,
        },
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
 * DELETE /api/v1/events/:id/registrations/:email
 * Supprime une inscription (la marque comme CANCELLED)
 */
export async function DELETE(request: NextRequest, { params }: Params) {
  const user = await verifyApiKey(request);
  if (!user) {
    return errorResponse("Unauthorized - Invalid or missing API key", 401);
  }

  const { id, email } = await params;
  const decodedEmail = decodeURIComponent(email);

  // Vérifier l'événement avec infos organisateur
  const event = await db.event.findFirst({
    where: {
      OR: [{ id }, { slug: id }],
      ...(user.role !== "ADMIN" && { organizerId: user.id }),
    },
    include: {
      organizer: { select: { id: true, email: true, name: true } },
      registrations: {
        where: { status: { not: RegistrationStatus.CANCELLED } },
        select: { status: true },
      },
    },
  });

  if (!event) {
    return errorResponse("Event not found", 404);
  }

  // Trouver l'inscription
  const registration = await db.registration.findUnique({
    where: {
      email_eventId: {
        email: decodedEmail,
        eventId: event.id,
      },
    },
  });

  if (!registration) {
    return errorResponse("Registration not found", 404);
  }

  if (registration.status === RegistrationStatus.CANCELLED) {
    return errorResponse("Registration is already cancelled", 400);
  }

  const wasConfirmed = registration.status === RegistrationStatus.CONFIRMED;

  // Annuler l'inscription
  await db.registration.update({
    where: { id: registration.id },
    data: { status: RegistrationStatus.CANCELLED },
  });

  // Promouvoir le premier en waitlist si l'inscription était confirmée
  let promoted = null;
  if (wasConfirmed) {
    promoted = await promoteFromWaitlist(event.id, event);
  }

  // Envoyer les emails (async)
  const appUrl = process.env.APP_URL || "https://eventlite.context-collective.org";

  // Calculer les counts après annulation
  const confirmedCount = event.registrations.filter(
    (r) => r.status === RegistrationStatus.CONFIRMED
  ).length - (wasConfirmed ? 1 : 0) + (promoted ? 1 : 0);
  const waitlistCount = event.registrations.filter(
    (r) => r.status === RegistrationStatus.WAITLIST
  ).length - (registration.status === RegistrationStatus.WAITLIST ? 1 : 0) - (promoted ? 1 : 0);

  // Email de confirmation d'annulation au participant
  sendEmail({
    to: registration.email,
    subject: `Inscription annulée - ${event.title}`,
    react: CancellationConfirmationEmail({
      firstName: registration.firstName,
      eventTitle: event.title,
      eventDate: formatDateRange(event.startAt, event.endAt),
      eventUrl: `${appUrl}/e/${event.slug}`,
    }),
  }).catch((err) => console.error("Erreur envoi email annulation participant:", err));

  // Email à l'organisateur
  sendEmail({
    to: event.organizer.email,
    subject: `Annulation - ${event.title}`,
    react: CancellationOrganizerEmail({
      organizerName: event.organizer.name || "Organisateur",
      participantName: `${registration.firstName} ${registration.lastName}`,
      participantEmail: registration.email,
      eventTitle: event.title,
      eventDate: formatDateRange(event.startAt, event.endAt),
      confirmedCount,
      capacity: event.capacity,
      waitlistCount,
      promotedParticipant: promoted
        ? {
            name: `${promoted.firstName} ${promoted.lastName}`,
            email: promoted.email,
          }
        : undefined,
      dashboardUrl: `${appUrl}/dashboard/events/${event.id}/registrations`,
    }),
  }).catch((err) => console.error("Erreur envoi email annulation organisateur:", err));

  // Déclencher webhook d'annulation
  triggerWebhooks(event.organizer.id, "registration.cancelled", {
    registration: {
      id: registration.id,
      email: registration.email,
      name: `${registration.firstName} ${registration.lastName}`,
      status: "CANCELLED",
    },
    event: {
      id: event.id,
      title: event.title,
      slug: event.slug,
    },
  }).catch((err) => console.error("Erreur webhook:", err));

  return jsonResponse({
    data: {
      message: "Registration cancelled successfully",
      promoted: promoted
        ? {
            email: promoted.email,
            name: `${promoted.firstName} ${promoted.lastName}`,
          }
        : null,
    },
  });
}

/**
 * Promouvoir le premier inscrit en liste d'attente
 */
async function promoteFromWaitlist(eventId: string, event: {
  id: string;
  title: string;
  slug: string;
  startAt: Date;
  endAt: Date;
  location: string | null;
  mode: string;
  organizer: { id: string; email: string; name: string | null };
}) {
  const nextInWaitlist = await db.registration.findFirst({
    where: {
      eventId,
      status: RegistrationStatus.WAITLIST,
    },
    orderBy: { createdAt: "asc" },
  });

  if (nextInWaitlist) {
    await db.registration.update({
      where: { id: nextInWaitlist.id },
      data: { status: RegistrationStatus.CONFIRMED },
    });

    // Envoyer email de promotion au participant promu
    const appUrl = process.env.APP_URL || "https://eventlite.context-collective.org";

    sendEmail({
      to: nextInWaitlist.email,
      subject: `Bonne nouvelle ! Place confirmée - ${event.title}`,
      react: WaitlistPromotedEmail({
        firstName: nextInWaitlist.firstName,
        eventTitle: event.title,
        eventDate: formatDateRange(event.startAt, event.endAt),
        eventLocation: event.location || undefined,
        isOnline: event.mode === "ONLINE",
        eventUrl: `${appUrl}/e/${event.slug}`,
        cancelUrl: `${appUrl}/cancel/${nextInWaitlist.cancelToken}`,
      }),
    }).catch((err) => console.error("Erreur envoi email promotion:", err));

    // Déclencher webhook de promotion
    triggerWebhooks(event.organizer.id, "registration.promoted", {
      registration: {
        id: nextInWaitlist.id,
        email: nextInWaitlist.email,
        name: `${nextInWaitlist.firstName} ${nextInWaitlist.lastName}`,
        status: "CONFIRMED",
        previous_status: "WAITLIST",
      },
      event: {
        id: event.id,
        title: event.title,
        slug: event.slug,
      },
    }).catch((err) => console.error("Erreur webhook:", err));

    return nextInWaitlist;
  }

  return null;
}
