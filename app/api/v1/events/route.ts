import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { verifyApiKey, jsonResponse, errorResponse } from "@/lib/api-auth";
import { eventSchema } from "@/lib/validations";
import { slugify } from "@/lib/utils";
import { triggerWebhooks } from "@/lib/webhooks";
import { EventStatus } from "@prisma/client";

/**
 * GET /api/v1/events
 * Liste tous les événements de l'utilisateur authentifié
 * Query params: status (DRAFT|PUBLISHED|CLOSED|CANCELLED), limit, offset
 */
export async function GET(request: NextRequest) {
  const user = await verifyApiKey(request);
  if (!user) {
    return errorResponse("Unauthorized - Invalid or missing API key", 401);
  }

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status") as EventStatus | null;
  const limit = Math.min(parseInt(searchParams.get("limit") || "50"), 100);
  const offset = parseInt(searchParams.get("offset") || "0");

  const where = {
    ...(user.role !== "ADMIN" && { organizerId: user.id }),
    ...(status && { status }),
  };

  const [events, total] = await Promise.all([
    db.event.findMany({
      where,
      take: limit,
      skip: offset,
      orderBy: { createdAt: "desc" },
      include: {
        _count: {
          select: {
            registrations: {
              where: { status: "CONFIRMED" },
            },
          },
        },
      },
    }),
    db.event.count({ where }),
  ]);

  return jsonResponse({
    data: events.map((event) => ({
      ...event,
      registrations_count: event._count.registrations,
      _count: undefined,
    })),
    pagination: {
      total,
      limit,
      offset,
      has_more: offset + events.length < total,
    },
  });
}

/**
 * POST /api/v1/events
 * Crée un nouvel événement
 */
export async function POST(request: NextRequest) {
  const user = await verifyApiKey(request);
  if (!user) {
    return errorResponse("Unauthorized - Invalid or missing API key", 401);
  }

  try {
    const body = await request.json();

    // Calculer endAt si non fourni (startAt + 2h)
    if (body.startAt && !body.endAt) {
      const startDate = new Date(body.startAt);
      body.endAt = new Date(startDate.getTime() + 2 * 60 * 60 * 1000).toISOString();
    }

    // Valider les données
    const validated = eventSchema.safeParse({
      ...body,
      waitlist: body.waitlist ?? true,
      status: body.status ?? "DRAFT",
    });

    if (!validated.success) {
      return errorResponse(
        validated.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join(", "),
        400
      );
    }

    // Générer un slug unique
    let slug = slugify(validated.data.title);
    const existingSlug = await db.event.findUnique({ where: { slug } });
    if (existingSlug) {
      slug = `${slug}-${Date.now().toString(36)}`;
    }

    const event = await db.event.create({
      data: {
        ...validated.data,
        slug,
        organizerId: user.id,
      },
    });

    // Déclencher webhook event.created (async)
    triggerWebhooks(user.id, "event.created", {
      event: {
        id: event.id,
        title: event.title,
        slug: event.slug,
        status: event.status,
        start_at: event.startAt.toISOString(),
        end_at: event.endAt.toISOString(),
      },
    }).catch((err) => console.error("Erreur webhook:", err));

    return jsonResponse({ data: event }, 201);
  } catch (error) {
    console.error("API Error:", error);
    return errorResponse(
      error instanceof Error ? error.message : "Internal server error",
      500
    );
  }
}
