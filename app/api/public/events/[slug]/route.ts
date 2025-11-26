import { db } from "@/lib/db";

interface RouteParams {
  params: Promise<{ slug: string }>;
}

/**
 * GET /api/public/events/:slug
 * Récupère un événement public par son slug
 * Pas d'authentification requise - retourne uniquement si l'événement est PUBLISHED
 */
export async function GET(_request: Request, { params }: RouteParams) {
  const { slug } = await params;

  const event = await db.event.findUnique({
    where: {
      slug,
      status: "PUBLISHED",
    },
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
      waitlist: true,
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
  });

  if (!event) {
    return Response.json(
      { error: "Event not found" },
      {
        status: 404,
        headers: corsHeaders(),
      }
    );
  }

  const response = {
    event: {
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
      waitlist: event.waitlist,
      registrationsCount: event._count.registrations,
      spotsLeft: event.capacity
        ? Math.max(0, event.capacity - event._count.registrations)
        : null,
      isFull: event.capacity
        ? event._count.registrations >= event.capacity
        : false,
      organizerName: event.organizer.name,
    },
  };

  return Response.json(response, {
    headers: {
      ...corsHeaders(),
      "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
    },
  });
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
