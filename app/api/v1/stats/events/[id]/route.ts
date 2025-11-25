import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { verifyApiKey, jsonResponse, errorResponse } from "@/lib/api-auth";
import { RegistrationStatus } from "@prisma/client";

type Params = {
  params: Promise<{ id: string }>;
};

/**
 * GET /api/v1/stats/events/:id
 * Retourne les statistiques détaillées d'un événement
 */
export async function GET(request: NextRequest, { params }: Params) {
  const user = await verifyApiKey(request);
  if (!user) {
    return errorResponse("Unauthorized - Invalid or missing API key", 401);
  }

  const { id } = await params;

  // Trouver l'événement
  const event = await db.event.findFirst({
    where: {
      OR: [{ id }, { slug: id }],
      ...(user.role !== "ADMIN" && { organizerId: user.id }),
    },
  });

  if (!event) {
    return errorResponse("Event not found", 404);
  }

  // Récupérer les stats en parallèle
  const [confirmedCount, waitlistCount, cancelledCount, registrations] =
    await Promise.all([
      db.registration.count({
        where: { eventId: event.id, status: RegistrationStatus.CONFIRMED },
      }),
      db.registration.count({
        where: { eventId: event.id, status: RegistrationStatus.WAITLIST },
      }),
      db.registration.count({
        where: { eventId: event.id, status: RegistrationStatus.CANCELLED },
      }),
      // Récupérer toutes les inscriptions pour la timeline
      db.registration.findMany({
        where: {
          eventId: event.id,
          status: { not: RegistrationStatus.CANCELLED },
        },
        orderBy: { createdAt: "asc" },
        select: { createdAt: true },
      }),
    ]);

  // Calculer le taux de remplissage
  const fillRate = event.capacity
    ? Math.round((confirmedCount / event.capacity) * 1000) / 10
    : null;

  // Construire la timeline (inscriptions cumulées par jour)
  const timeline: { date: string; cumulative: number }[] = [];
  if (registrations.length > 0) {
    const dateMap = new Map<string, number>();

    registrations.forEach((r) => {
      const dateKey = r.createdAt.toISOString().split("T")[0];
      dateMap.set(dateKey, (dateMap.get(dateKey) || 0) + 1);
    });

    // Trier les dates et calculer le cumul
    const sortedDates = Array.from(dateMap.keys()).sort();
    let cumulative = 0;

    for (const date of sortedDates) {
      cumulative += dateMap.get(date) || 0;
      timeline.push({ date, cumulative });
    }
  }

  return jsonResponse({
    data: {
      event: {
        id: event.id,
        title: event.title,
        slug: event.slug,
        status: event.status,
        start_at: event.startAt.toISOString(),
        end_at: event.endAt.toISOString(),
      },
      registrations: {
        confirmed: confirmedCount,
        waitlist: waitlistCount,
        cancelled: cancelledCount,
        total: confirmedCount + waitlistCount,
        capacity: event.capacity,
        fill_rate: fillRate,
        spots_left: event.capacity ? Math.max(0, event.capacity - confirmedCount) : null,
      },
      timeline,
    },
  });
}
