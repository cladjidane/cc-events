import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { verifyApiKey, jsonResponse, errorResponse } from "@/lib/api-auth";
import { RegistrationStatus, EventStatus } from "@prisma/client";
import { z } from "zod";
import { sendEmail } from "@/lib/email";
import { ConfirmationEmail } from "@/emails/confirmation";
import { NewRegistrationOrganizerEmail } from "@/emails/new-registration-organizer";
import { formatDateRange } from "@/lib/utils";
import { triggerWebhooks } from "@/lib/webhooks";

type Params = {
  params: Promise<{ id: string }>;
};

// Schéma de validation pour créer une inscription via API
const createRegistrationSchema = z.object({
  email: z.string().email("Invalid email address"),
  name: z.string().min(1, "Name is required").max(100),
  notes: z.string().max(500).optional(),
});

/**
 * GET /api/v1/events/:id/registrations
 * Liste les inscriptions d'un événement
 */
export async function GET(request: NextRequest, { params }: Params) {
  const user = await verifyApiKey(request);
  if (!user) {
    return errorResponse("Unauthorized - Invalid or missing API key", 401);
  }

  const { id } = await params;
  const searchParams = request.nextUrl.searchParams;

  // Paramètres de filtrage
  const status = searchParams.get("status") as RegistrationStatus | null;
  const limit = Math.min(parseInt(searchParams.get("limit") || "50"), 100);
  const offset = parseInt(searchParams.get("offset") || "0");

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

  // Construire le filtre
  const where = {
    eventId: event.id,
    ...(status && { status }),
    // Ne pas inclure les inscriptions annulées par défaut
    ...(!status && { status: { not: RegistrationStatus.CANCELLED } }),
  };

  // Récupérer les inscriptions avec pagination
  const [registrations, total] = await Promise.all([
    db.registration.findMany({
      where,
      take: limit,
      skip: offset,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        notes: true,
        status: true,
        createdAt: true,
        updatedAt: true,
      },
    }),
    db.registration.count({ where }),
  ]);

  // Formater la réponse avec snake_case
  const formattedRegistrations = registrations.map((r) => ({
    id: r.id,
    email: r.email,
    name: `${r.firstName} ${r.lastName}`,
    first_name: r.firstName,
    last_name: r.lastName,
    notes: r.notes,
    status: r.status,
    registered_at: r.createdAt.toISOString(),
    updated_at: r.updatedAt.toISOString(),
  }));

  return jsonResponse({
    data: formattedRegistrations,
    pagination: {
      total,
      limit,
      offset,
      has_more: offset + registrations.length < total,
    },
  });
}

/**
 * POST /api/v1/events/:id/registrations
 * Inscrit quelqu'un à un événement
 */
export async function POST(request: NextRequest, { params }: Params) {
  const user = await verifyApiKey(request);
  if (!user) {
    return errorResponse("Unauthorized - Invalid or missing API key", 401);
  }

  const { id } = await params;

  // Vérifier que l'événement existe et appartient à l'utilisateur
  const eventCheck = await db.event.findFirst({
    where: {
      OR: [{ id }, { slug: id }],
      ...(user.role !== "ADMIN" && { organizerId: user.id }),
    },
  });

  if (!eventCheck) {
    return errorResponse("Event not found", 404);
  }

  try {
    const body = await request.json();

    // Valider les données
    const validated = createRegistrationSchema.safeParse(body);
    if (!validated.success) {
      return errorResponse(
        validated.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join(", "),
        400
      );
    }

    const { email, name, notes } = validated.data;

    // Séparer le nom en prénom/nom
    const nameParts = name.trim().split(/\s+/);
    const firstName = nameParts[0] || name;
    const lastName = nameParts.slice(1).join(" ") || "-";

    // Transaction pour gérer la concurrence
    const result = await db.$transaction(async (tx) => {
      // Récupérer l'événement avec compte des confirmés et infos organisateur
      const event = await tx.event.findUnique({
        where: { id: eventCheck.id },
        include: {
          organizer: {
            select: { id: true, email: true, name: true },
          },
          _count: {
            select: {
              registrations: {
                where: { status: RegistrationStatus.CONFIRMED },
              },
            },
          },
        },
      });

      if (!event) {
        throw new Error("Event not found");
      }

      if (event.status !== EventStatus.PUBLISHED) {
        throw new Error("Event is not open for registrations");
      }

      // Vérifier si déjà inscrit
      const existingRegistration = await tx.registration.findUnique({
        where: {
          email_eventId: {
            email,
            eventId: event.id,
          },
        },
      });

      if (existingRegistration) {
        if (existingRegistration.status === RegistrationStatus.CANCELLED) {
          // Réactiver l'inscription annulée
          const confirmedCount = event._count.registrations;
          const hasCapacity = !event.capacity || confirmedCount < event.capacity;

          const newStatus = hasCapacity
            ? RegistrationStatus.CONFIRMED
            : event.waitlist
              ? RegistrationStatus.WAITLIST
              : null;

          if (!newStatus) {
            throw new Error("Event is full");
          }

          const updatedRegistration = await tx.registration.update({
            where: { id: existingRegistration.id },
            data: {
              status: newStatus,
              firstName,
              lastName,
              notes,
            },
          });

          return { registration: updatedRegistration, event, isReactivated: true };
        }

        throw new Error("Email already registered for this event");
      }

      // Déterminer le statut
      const confirmedCount = event._count.registrations;
      const hasCapacity = !event.capacity || confirmedCount < event.capacity;

      let status: RegistrationStatus;

      if (hasCapacity) {
        status = RegistrationStatus.CONFIRMED;
      } else if (event.waitlist) {
        status = RegistrationStatus.WAITLIST;
      } else {
        throw new Error("Event is full and waitlist is disabled");
      }

      // Créer l'inscription
      const registration = await tx.registration.create({
        data: {
          eventId: event.id,
          firstName,
          lastName,
          email,
          notes,
          status,
        },
      });

      return { registration, event, isReactivated: false };
    });

    // Formater la réponse
    const response = {
      id: result.registration.id,
      email: result.registration.email,
      name: `${result.registration.firstName} ${result.registration.lastName}`,
      first_name: result.registration.firstName,
      last_name: result.registration.lastName,
      notes: result.registration.notes,
      status: result.registration.status,
      registered_at: result.registration.createdAt.toISOString(),
      event: {
        id: result.event.id,
        title: result.event.title,
        slug: result.event.slug,
      },
    };

    // Envoyer les emails (async, ne bloque pas la réponse)
    const appUrl = process.env.APP_URL || "https://eventlite.context-collective.org";

    // Email de confirmation au participant
    sendEmail({
      to: result.registration.email,
      subject: result.registration.status === RegistrationStatus.WAITLIST
        ? `Liste d'attente - ${result.event.title}`
        : `Inscription confirmée - ${result.event.title}`,
      react: ConfirmationEmail({
        firstName: result.registration.firstName,
        eventTitle: result.event.title,
        eventDate: formatDateRange(result.event.startAt, result.event.endAt),
        eventLocation: result.event.location || undefined,
        isOnline: result.event.mode === "ONLINE",
        cancelUrl: `${appUrl}/cancel/${result.registration.cancelToken}`,
        eventUrl: `${appUrl}/e/${result.event.slug}`,
        isWaitlist: result.registration.status === RegistrationStatus.WAITLIST,
      }),
    }).catch((err) => console.error("Erreur envoi email participant:", err));

    // Email de notification à l'organisateur
    const confirmedCount = result.event._count.registrations +
      (result.registration.status === RegistrationStatus.CONFIRMED ? 1 : 0);
    const waitlistCount = result.registration.status === RegistrationStatus.WAITLIST ? 1 : 0;

    sendEmail({
      to: result.event.organizer.email,
      subject: `Nouvelle inscription - ${result.event.title}`,
      react: NewRegistrationOrganizerEmail({
        organizerName: result.event.organizer.name || "Organisateur",
        participantName: `${result.registration.firstName} ${result.registration.lastName}`,
        participantEmail: result.registration.email,
        eventTitle: result.event.title,
        eventDate: formatDateRange(result.event.startAt, result.event.endAt),
        registrationStatus: result.registration.status as "CONFIRMED" | "WAITLIST",
        confirmedCount,
        capacity: result.event.capacity,
        waitlistCount,
        dashboardUrl: `${appUrl}/dashboard/events/${result.event.id}/registrations`,
        notes: result.registration.notes || undefined,
      }),
    }).catch((err) => console.error("Erreur envoi email organisateur:", err));

    // Déclencher les webhooks
    triggerWebhooks(result.event.organizer.id, "registration.created", {
      registration: {
        id: result.registration.id,
        email: result.registration.email,
        name: `${result.registration.firstName} ${result.registration.lastName}`,
        status: result.registration.status,
      },
      event: {
        id: result.event.id,
        title: result.event.title,
        slug: result.event.slug,
      },
    }).catch((err) => console.error("Erreur webhook:", err));

    return jsonResponse({ data: response }, 201);
  } catch (error) {
    console.error("API Error:", error);

    // Erreurs métier
    if (error instanceof Error) {
      const businessErrors = [
        "Event not found",
        "Event is not open for registrations",
        "Email already registered for this event",
        "Event is full",
        "Event is full and waitlist is disabled",
      ];

      if (businessErrors.some((msg) => error.message.includes(msg))) {
        return errorResponse(error.message, 400);
      }
    }

    return errorResponse(
      error instanceof Error ? error.message : "Internal server error",
      500
    );
  }
}
