import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { verifyApiKey, jsonResponse, errorResponse } from "@/lib/api-auth";
import { RegistrationStatus } from "@prisma/client";

/**
 * GET /api/v1/stats
 * Retourne les statistiques globales de l'utilisateur
 */
export async function GET(request: NextRequest) {
  const user = await verifyApiKey(request);
  if (!user) {
    return errorResponse("Unauthorized - Invalid or missing API key", 401);
  }

  // Filtre pour les événements de l'utilisateur (sauf admin)
  const eventFilter = user.role !== "ADMIN" ? { organizerId: user.id } : {};

  // Récupérer les stats en parallèle
  const [
    totalEvents,
    draftEvents,
    publishedEvents,
    closedEvents,
    cancelledEvents,
    totalRegistrations,
    confirmedRegistrations,
    waitlistRegistrations,
    upcomingEvents,
    recentRegistrations,
  ] = await Promise.all([
    // Compteurs d'événements
    db.event.count({ where: eventFilter }),
    db.event.count({ where: { ...eventFilter, status: "DRAFT" } }),
    db.event.count({ where: { ...eventFilter, status: "PUBLISHED" } }),
    db.event.count({ where: { ...eventFilter, status: "CLOSED" } }),
    db.event.count({ where: { ...eventFilter, status: "CANCELLED" } }),

    // Compteurs d'inscriptions (via les événements de l'utilisateur)
    db.registration.count({
      where: {
        event: eventFilter,
        status: { not: RegistrationStatus.CANCELLED },
      },
    }),
    db.registration.count({
      where: {
        event: eventFilter,
        status: RegistrationStatus.CONFIRMED,
      },
    }),
    db.registration.count({
      where: {
        event: eventFilter,
        status: RegistrationStatus.WAITLIST,
      },
    }),

    // Événements à venir
    db.event.findMany({
      where: {
        ...eventFilter,
        status: "PUBLISHED",
        startAt: { gte: new Date() },
      },
      orderBy: { startAt: "asc" },
      take: 5,
      include: {
        _count: {
          select: {
            registrations: {
              where: { status: RegistrationStatus.CONFIRMED },
            },
          },
        },
      },
    }),

    // Inscriptions récentes
    db.registration.findMany({
      where: {
        event: eventFilter,
        status: { not: RegistrationStatus.CANCELLED },
      },
      orderBy: { createdAt: "desc" },
      take: 10,
      include: {
        event: {
          select: { title: true, slug: true },
        },
      },
    }),
  ]);

  return jsonResponse({
    data: {
      events: {
        total: totalEvents,
        by_status: {
          draft: draftEvents,
          published: publishedEvents,
          closed: closedEvents,
          cancelled: cancelledEvents,
        },
      },
      registrations: {
        total: totalRegistrations,
        by_status: {
          confirmed: confirmedRegistrations,
          waitlist: waitlistRegistrations,
        },
      },
      upcoming: upcomingEvents.map((e) => ({
        id: e.id,
        title: e.title,
        slug: e.slug,
        start_at: e.startAt.toISOString(),
        confirmed: e._count.registrations,
        capacity: e.capacity,
      })),
      recent_activity: recentRegistrations.map((r) => ({
        type: "registration",
        action: "created",
        email: r.email,
        name: `${r.firstName} ${r.lastName}`,
        event_title: r.event.title,
        event_slug: r.event.slug,
        at: r.createdAt.toISOString(),
      })),
    },
  });
}
