import Link from "next/link";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, Users, Clock, Plus } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Dashboard",
};

export default async function DashboardPage() {
  const session = await auth();

  if (!session?.user) {
    return null;
  }

  const where =
    session.user.role === "ADMIN" ? {} : { organizerId: session.user.id };

  const [totalEvents, publishedEvents, totalRegistrations, upcomingEvents] =
    await Promise.all([
      db.event.count({ where }),
      db.event.count({ where: { ...where, status: "PUBLISHED" } }),
      db.registration.count({
        where: {
          event: where,
          status: "CONFIRMED",
        },
      }),
      db.event.findMany({
        where: {
          ...where,
          status: "PUBLISHED",
          startAt: { gte: new Date() },
        },
        orderBy: { startAt: "asc" },
        take: 5,
        include: {
          _count: {
            select: {
              registrations: { where: { status: "CONFIRMED" } },
            },
          },
        },
      }),
    ]);

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">
            Bienvenue, {session.user.name || session.user.email}
          </p>
        </div>
        <Link href="/dashboard/events/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Nouvel événement
          </Button>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              Total événements
            </CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalEvents}</div>
            <p className="text-xs text-muted-foreground">
              {publishedEvents} publié{publishedEvents > 1 ? "s" : ""}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Inscriptions</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalRegistrations}</div>
            <p className="text-xs text-muted-foreground">confirmées</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">À venir</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{upcomingEvents.length}</div>
            <p className="text-xs text-muted-foreground">événements</p>
          </CardContent>
        </Card>
      </div>

      {/* Upcoming Events */}
      <Card>
        <CardHeader>
          <CardTitle>Prochains événements</CardTitle>
        </CardHeader>
        <CardContent>
          {upcomingEvents.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              Aucun événement à venir.{" "}
              <Link
                href="/dashboard/events/new"
                className="text-primary underline"
              >
                Créer un événement
              </Link>
            </p>
          ) : (
            <div className="space-y-4">
              {upcomingEvents.map((event) => (
                <div
                  key={event.id}
                  className="flex items-center justify-between border-b pb-4 last:border-0 last:pb-0"
                >
                  <div>
                    <Link
                      href={`/dashboard/events/${event.id}`}
                      className="font-medium hover:underline"
                    >
                      {event.title}
                    </Link>
                    <p className="text-sm text-muted-foreground">
                      {new Date(event.startAt).toLocaleDateString("fr-FR", {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      })}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">
                      {event._count.registrations}
                      {event.capacity && `/${event.capacity}`}
                    </p>
                    <p className="text-sm text-muted-foreground">inscrits</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
