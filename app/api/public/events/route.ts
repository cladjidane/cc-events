import { NextRequest } from "next/server";
import { db } from "@/lib/db";

/**
 * GET /api/public/events
 * Endpoint public pour lister les événements publiés
 * Pas d'authentification requise - expose uniquement les événements PUBLISHED
 *
 * Query params:
 *   - city: filtrer par ville (recherche dans le champ location)
 *   - organizer: filtrer par ID ou email de l'organisateur
 *   - upcoming: "true" pour les événements futurs uniquement, "false" pour les passés
 *   - mode: ONLINE | IN_PERSON
 *   - limit: nombre max de résultats (default: 10, max: 50)
 *   - offset: pagination offset
 *
 * Headers CORS inclus pour permettre l'appel depuis d'autres domaines
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);

  const city = searchParams.get("city");
  const organizer = searchParams.get("organizer");
  const upcoming = searchParams.get("upcoming");
  const mode = searchParams.get("mode");
  const limit = Math.min(parseInt(searchParams.get("limit") || "10"), 50);
  const offset = parseInt(searchParams.get("offset") || "0");

  // Build organizer filter
  let organizerFilter = {};
  if (organizer) {
    // Chercher par ID ou par email
    const user = await db.user.findFirst({
      where: {
        OR: [
          { id: organizer },
          { email: organizer },
        ],
      },
      select: { id: true },
    });

    if (user) {
      organizerFilter = { organizerId: user.id };
    } else {
      // Si l'organisateur n'existe pas, retourner une liste vide
      return jsonResponseWithCors({
        events: [],
        pagination: {
          total: 0,
          limit,
          offset,
          hasMore: false,
        },
      });
    }
  }

  // Build date filter
  let dateFilter = {};
  if (upcoming === "true") {
    dateFilter = { startAt: { gte: new Date() } };
  } else if (upcoming === "false") {
    dateFilter = { startAt: { lt: new Date() } };
  }

  const where = {
    status: "PUBLISHED" as const,
    ...organizerFilter,
    ...dateFilter,
    ...(city && {
      location: { contains: city, mode: "insensitive" as const },
    }),
    ...(mode && { mode: mode as "ONLINE" | "IN_PERSON" }),
  };

  const [events, total] = await Promise.all([
    db.event.findMany({
      where,
      take: limit,
      skip: offset,
      orderBy: upcoming === "false"
        ? { startAt: "desc" }
        : { startAt: "asc" },
      select: {
        id: true,
        slug: true,
        title: true,
        subtitle: true,
        description: true,
        coverImage: true,
        mode: true,
        location: true,
        startAt: true,
        endAt: true,
        timezone: true,
        capacity: true,
        _count: {
          select: {
            registrations: {
              where: { status: "CONFIRMED" },
            },
          },
        },
        organizer: {
          select: {
            name: true,
          },
        },
      },
    }),
    db.event.count({ where }),
  ]);

  const response = {
    events: events.map((event) => ({
      id: event.id,
      slug: event.slug,
      title: event.title,
      subtitle: event.subtitle,
      description: event.description,
      coverImage: event.coverImage,
      mode: event.mode,
      location: event.location,
      startAt: event.startAt.toISOString(),
      endAt: event.endAt.toISOString(),
      timezone: event.timezone,
      capacity: event.capacity,
      registrationsCount: event._count.registrations,
      organizerName: event.organizer.name,
    })),
    pagination: {
      total,
      limit,
      offset,
      hasMore: offset + events.length < total,
    },
  };

  return jsonResponseWithCors(response);
}

/**
 * OPTIONS handler for CORS preflight requests
 */
export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: corsHeaders(),
  });
}

function corsHeaders(): HeadersInit {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Max-Age": "86400",
  };
}

function jsonResponseWithCors(data: unknown, status = 200) {
  return Response.json(data, {
    status,
    headers: {
      ...corsHeaders(),
      "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
    },
  });
}
