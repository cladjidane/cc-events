import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { verifyApiKey, jsonResponse, errorResponse } from "@/lib/api-auth";
import { eventSchema } from "@/lib/validations";
import { slugify } from "@/lib/utils";
import { triggerWebhooks } from "@/lib/webhooks";

type Params = {
  params: Promise<{ id: string }>;
};

/**
 * GET /api/v1/events/:id
 * Récupère un événement par son ID ou slug
 */
export async function GET(request: NextRequest, { params }: Params) {
  const user = await verifyApiKey(request);
  if (!user) {
    return errorResponse("Unauthorized - Invalid or missing API key", 401);
  }

  const { id } = await params;

  // Chercher par ID ou par slug
  const event = await db.event.findFirst({
    where: {
      OR: [{ id }, { slug: id }],
      ...(user.role !== "ADMIN" && { organizerId: user.id }),
    },
    include: {
      organizer: {
        select: { id: true, name: true, email: true },
      },
      _count: {
        select: {
          registrations: true,
        },
      },
    },
  });

  if (!event) {
    return errorResponse("Event not found", 404);
  }

  // Compter confirmés et waitlist séparément
  const [confirmedCount, waitlistCount] = await Promise.all([
    db.registration.count({
      where: { eventId: event.id, status: "CONFIRMED" },
    }),
    db.registration.count({
      where: { eventId: event.id, status: "WAITLIST" },
    }),
  ]);

  return jsonResponse({
    data: {
      ...event,
      confirmed_count: confirmedCount,
      waitlist_count: waitlistCount,
      total_registrations: event._count.registrations,
      _count: undefined,
    },
  });
}

/**
 * PATCH /api/v1/events/:id
 * Met à jour un événement
 */
export async function PATCH(request: NextRequest, { params }: Params) {
  const user = await verifyApiKey(request);
  if (!user) {
    return errorResponse("Unauthorized - Invalid or missing API key", 401);
  }

  const { id } = await params;

  const existingEvent = await db.event.findFirst({
    where: {
      OR: [{ id }, { slug: id }],
    },
  });

  if (!existingEvent) {
    return errorResponse("Event not found", 404);
  }

  if (existingEvent.organizerId !== user.id && user.role !== "ADMIN") {
    return errorResponse("Forbidden - You don't own this event", 403);
  }

  try {
    const body = await request.json();

    // Merge avec les données existantes
    const mergedData = {
      title: body.title ?? existingEvent.title,
      subtitle: body.subtitle ?? existingEvent.subtitle,
      description: body.description ?? existingEvent.description,
      coverImage: body.coverImage ?? existingEvent.coverImage,
      mode: body.mode ?? existingEvent.mode,
      location: body.location ?? existingEvent.location,
      latitude: body.latitude ?? existingEvent.latitude,
      longitude: body.longitude ?? existingEvent.longitude,
      startAt: body.startAt ?? existingEvent.startAt,
      endAt: body.endAt ?? existingEvent.endAt,
      timezone: body.timezone ?? existingEvent.timezone,
      capacity: body.capacity ?? existingEvent.capacity,
      waitlist: body.waitlist ?? existingEvent.waitlist,
      status: body.status ?? existingEvent.status,
    };

    // Calculer endAt si startAt est modifié mais pas endAt
    if (body.startAt && !body.endAt) {
      const startDate = new Date(body.startAt);
      mergedData.endAt = new Date(startDate.getTime() + 2 * 60 * 60 * 1000).toISOString();
    }

    const validated = eventSchema.safeParse(mergedData);

    if (!validated.success) {
      return errorResponse(
        validated.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join(", "),
        400
      );
    }

    // Mettre à jour le slug si le titre change
    let slug = existingEvent.slug;
    if (body.title && body.title !== existingEvent.title) {
      slug = slugify(body.title);
      const existingSlug = await db.event.findFirst({
        where: { slug, id: { not: existingEvent.id } },
      });
      if (existingSlug) {
        slug = `${slug}-${Date.now().toString(36)}`;
      }
    }

    const event = await db.event.update({
      where: { id: existingEvent.id },
      data: {
        ...validated.data,
        slug,
      },
    });

    // Déclencher webhooks selon le type de changement
    const webhookEvent =
      body.status === "PUBLISHED" && existingEvent.status !== "PUBLISHED"
        ? "event.published"
        : body.status === "CANCELLED" && existingEvent.status !== "CANCELLED"
          ? "event.cancelled"
          : "event.updated";

    triggerWebhooks(existingEvent.organizerId, webhookEvent, {
      event: {
        id: event.id,
        title: event.title,
        slug: event.slug,
        status: event.status,
        previous_status: existingEvent.status,
        start_at: event.startAt.toISOString(),
        end_at: event.endAt.toISOString(),
      },
    }).catch((err) => console.error("Erreur webhook:", err));

    return jsonResponse({ data: event });
  } catch (error) {
    console.error("API Error:", error);
    return errorResponse(
      error instanceof Error ? error.message : "Internal server error",
      500
    );
  }
}

/**
 * DELETE /api/v1/events/:id
 * Supprime un événement
 */
export async function DELETE(request: NextRequest, { params }: Params) {
  const user = await verifyApiKey(request);
  if (!user) {
    return errorResponse("Unauthorized - Invalid or missing API key", 401);
  }

  const { id } = await params;

  const existingEvent = await db.event.findFirst({
    where: {
      OR: [{ id }, { slug: id }],
    },
  });

  if (!existingEvent) {
    return errorResponse("Event not found", 404);
  }

  if (existingEvent.organizerId !== user.id && user.role !== "ADMIN") {
    return errorResponse("Forbidden - You don't own this event", 403);
  }

  await db.event.delete({ where: { id: existingEvent.id } });

  return jsonResponse({ message: "Event deleted successfully" });
}
