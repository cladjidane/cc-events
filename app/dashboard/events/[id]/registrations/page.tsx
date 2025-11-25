import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { getEventById } from "@/actions/events";
import { getRegistrationsForEvent, getRegistrationStats } from "@/actions/registrations";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { RegistrationsTable } from "@/components/tables/registrations-table";
import type { Metadata } from "next";

type Props = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const event = await getEventById(id);
  return {
    title: event ? `Inscriptions - ${event.title}` : "Inscriptions",
  };
}

export default async function RegistrationsPage({ params }: Props) {
  const { id } = await params;
  const [event, registrations, stats] = await Promise.all([
    getEventById(id),
    getRegistrationsForEvent(id),
    getRegistrationStats(id),
  ]);

  if (!event) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <Link
        href={`/dashboard/events/${id}`}
        className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Retour à l'événement
      </Link>

      <div>
        <h1 className="text-3xl font-bold">Inscriptions</h1>
        <p className="text-muted-foreground">{event.title}</p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total</CardDescription>
            <CardTitle className="text-2xl">{stats?.total || 0}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Confirmés</CardDescription>
            <CardTitle className="text-2xl text-green-600">
              {stats?.confirmed || 0}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Liste d'attente</CardDescription>
            <CardTitle className="text-2xl text-amber-600">
              {stats?.waitlist || 0}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Places restantes</CardDescription>
            <CardTitle className="text-2xl">
              {stats?.spotsLeft !== null && stats?.spotsLeft !== undefined ? stats.spotsLeft : "∞"}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle>Liste des inscriptions</CardTitle>
          <CardDescription>
            {registrations.length} inscription{registrations.length > 1 ? "s" : ""}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {registrations.length === 0 ? (
            <p className="py-8 text-center text-muted-foreground">
              Aucune inscription pour cet événement.
            </p>
          ) : (
            <RegistrationsTable registrations={registrations} eventId={id} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
