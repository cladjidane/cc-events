import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ExternalLink, Users, Pencil, Trash2 } from "lucide-react";
import { getEventById, deleteEvent } from "@/actions/events";
import { getRegistrationStats } from "@/actions/registrations";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { EventForm } from "@/components/forms/event-form";
import { DeleteEventButton } from "@/components/delete-event-button";
import { RegenerateBriefButton } from "@/components/regenerate-brief-button";
import { formatDateRange } from "@/lib/utils";
import { Markdown } from "@/components/markdown";
import type { Metadata } from "next";

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ edit?: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const event = await getEventById(id);
  return {
    title: event?.title || "Événement",
  };
}

const statusLabels: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  DRAFT: { label: "Brouillon", variant: "secondary" },
  PUBLISHED: { label: "Publié", variant: "default" },
  CLOSED: { label: "Fermé", variant: "outline" },
  CANCELLED: { label: "Annulé", variant: "destructive" },
};

export default async function EventDetailPage({ params, searchParams }: Props) {
  const { id } = await params;
  const { edit } = await searchParams;
  const event = await getEventById(id);

  if (!event) {
    notFound();
  }

  const stats = await getRegistrationStats(id);
  const status = statusLabels[event.status];
  const isEditing = edit === "true";

  if (isEditing) {
    return (
      <div className="max-w-2xl">
        <Link
          href={`/dashboard/events/${id}`}
          className="mb-6 inline-flex items-center text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Retour aux détails
        </Link>

        <Card>
          <CardHeader>
            <CardTitle>Modifier l'événement</CardTitle>
          </CardHeader>
          <CardContent>
            <EventForm event={event} />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Link
        href="/dashboard/events"
        className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Retour aux événements
      </Link>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="mb-2 flex items-center gap-2">
            <Badge variant={status.variant}>{status.label}</Badge>
            <Badge variant={event.mode === "ONLINE" ? "secondary" : "outline"}>
              {event.mode === "ONLINE" ? "En ligne" : "Présentiel"}
            </Badge>
          </div>
          <h1 className="text-3xl font-bold">{event.title}</h1>
          {event.subtitle && (
            <p className="mt-1 text-lg text-muted-foreground">{event.subtitle}</p>
          )}
        </div>
        <div className="flex gap-2">
          {event.status === "PUBLISHED" && (
            <Link href={`/e/${event.slug}`} target="_blank">
              <Button variant="outline" size="sm">
                <ExternalLink className="mr-2 h-4 w-4" />
                Page publique
              </Button>
            </Link>
          )}
          <RegenerateBriefButton eventId={id} />
          <Link href={`/dashboard/events/${id}?edit=true`}>
            <Button variant="outline" size="sm">
              <Pencil className="mr-2 h-4 w-4" />
              Modifier
            </Button>
          </Link>
          <DeleteEventButton eventId={id} eventTitle={event.title} />
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Détails</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="text-sm font-medium text-muted-foreground">Date</h4>
                <p>{formatDateRange(event.startAt, event.endAt)}</p>
              </div>
              {event.location && (
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground">
                    {event.mode === "ONLINE" ? "Lien" : "Lieu"}
                  </h4>
                  <p>{event.location}</p>
                </div>
              )}
              {event.description && (
                <>
                  <Separator />
                  <div>
                    <h4 className="mb-2 text-sm font-medium text-muted-foreground">
                      Description
                    </h4>
                    <Markdown content={event.description} className="text-sm" />
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Inscriptions</CardTitle>
              <CardDescription>
                {stats?.capacity
                  ? `${stats.confirmed}/${stats.capacity} places`
                  : `${stats?.confirmed || 0} inscrits`}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-2xl font-bold text-green-600">
                    {stats?.confirmed || 0}
                  </p>
                  <p className="text-xs text-muted-foreground">Confirmés</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-amber-600">
                    {stats?.waitlist || 0}
                  </p>
                  <p className="text-xs text-muted-foreground">En attente</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-muted-foreground">
                    {stats?.cancelled || 0}
                  </p>
                  <p className="text-xs text-muted-foreground">Annulés</p>
                </div>
              </div>
              <Link href={`/dashboard/events/${id}/registrations`}>
                <Button variant="outline" className="w-full">
                  <Users className="mr-2 h-4 w-4" />
                  Voir les inscriptions
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Configuration</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Capacité</span>
                <span>{event.capacity || "Illimitée"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Liste d'attente</span>
                <span>{event.waitlist ? "Activée" : "Désactivée"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Fuseau horaire</span>
                <span>{event.timezone}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
