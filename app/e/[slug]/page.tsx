import { notFound } from "next/navigation";
import Link from "next/link";
import { Calendar, MapPin, Users, Globe, ArrowLeft, Clock, AlertCircle, Ticket } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { getEventBySlug } from "@/actions/events";
import { formatDateRange } from "@/lib/utils";
import { RegistrationForm } from "@/components/forms/registration-form";
import { EventMap } from "@/components/map";
import { IsoLogo, IsoTicket } from "@/components/illustrations/isometric-shapes";
import type { Metadata } from "next";

type Props = {
  params: Promise<{ slug: string }>;
};

const siteUrl = process.env.APP_URL || "https://eventlite.app";

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const event = await getEventBySlug(slug);

  if (!event) {
    return { title: "Événement introuvable" };
  }

  const eventUrl = `${siteUrl}/e/${event.slug}`;
  const description = event.subtitle || event.description?.slice(0, 160) || `Inscrivez-vous à ${event.title}`;

  return {
    title: event.title,
    description,
    openGraph: {
      title: event.title,
      description,
      url: eventUrl,
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: event.title,
      description,
    },
    alternates: {
      canonical: eventUrl,
    },
  };
}

// JSON-LD structured data for events (SEO)
function EventJsonLd({ event }: { event: NonNullable<Awaited<ReturnType<typeof getEventBySlug>>> }) {
  const eventUrl = `${siteUrl}/e/${event.slug}`;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Event",
    name: event.title,
    description: event.description || event.subtitle || `Événement: ${event.title}`,
    startDate: event.startAt.toISOString(),
    endDate: event.endAt.toISOString(),
    eventStatus: "https://schema.org/EventScheduled",
    eventAttendanceMode: event.mode === "ONLINE"
      ? "https://schema.org/OnlineEventAttendanceMode"
      : "https://schema.org/OfflineEventAttendanceMode",
    location: event.mode === "ONLINE"
      ? {
          "@type": "VirtualLocation",
          url: event.location || eventUrl,
        }
      : {
          "@type": "Place",
          name: event.location || "Lieu à confirmer",
          address: event.location || "Lieu à confirmer",
          ...(event.latitude && event.longitude && {
            geo: {
              "@type": "GeoCoordinates",
              latitude: event.latitude,
              longitude: event.longitude,
            },
          }),
        },
    organizer: {
      "@type": "Person",
      name: event.organizer.name || "Organisateur EventLite",
    },
    url: eventUrl,
    ...(event.capacity && {
      maximumAttendeeCapacity: event.capacity,
    }),
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "EUR",
      availability: event._count.confirmed >= (event.capacity || Infinity)
        ? "https://schema.org/SoldOut"
        : "https://schema.org/InStock",
      url: eventUrl,
      validFrom: new Date().toISOString(),
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}

export default async function EventPage({ params }: Props) {
  const { slug } = await params;
  const event = await getEventBySlug(slug);

  if (!event || event.status !== "PUBLISHED") {
    notFound();
  }

  const confirmedCount = event._count.confirmed;
  const waitlistCount = event._count.waitlist;
  const spotsLeft = event.capacity ? event.capacity - confirmedCount : null;
  const isFull = event.capacity ? confirmedCount >= event.capacity : false;
  const isPast = new Date(event.startAt) < new Date();

  return (
    <>
      <EventJsonLd event={event} />
      <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border/50 bg-background/90 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <Link href="/" className="flex items-center gap-2.5 text-xl font-bold group">
            <IsoLogo className="w-8 h-10 group-hover:scale-110 transition-transform" />
            <span className="text-3d tracking-tight">EventLite</span>
          </Link>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <Link
          href="/"
          className="mb-6 inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors group"
        >
          <ArrowLeft className="mr-2 h-4 w-4 group-hover:-translate-x-1 transition-transform" />
          Retour aux événements
        </Link>

        <div className="grid gap-8 lg:grid-cols-5">
          {/* Event Details */}
          <div className="lg:col-span-3">
            <div className="mb-4 flex flex-wrap items-center gap-2">
              <Badge variant={event.mode === "ONLINE" ? "secondary" : "outline"} className="badge-float">
                {event.mode === "ONLINE" ? "En ligne" : "Présentiel"}
              </Badge>
              {isPast && <Badge variant="destructive" className="badge-float">Événement passé</Badge>}
              {!isPast && isFull && !event.waitlist && (
                <Badge variant="destructive" className="badge-float">Complet</Badge>
              )}
              {!isPast && isFull && event.waitlist && (
                <Badge variant="secondary" className="badge-float">Liste d'attente</Badge>
              )}
            </div>

            <h1 className="mb-2 text-3xl font-bold tracking-tight sm:text-4xl text-3d">
              {event.title}
            </h1>

            {event.subtitle && (
              <p className="mb-6 text-xl text-muted-foreground">
                {event.subtitle}
              </p>
            )}

            <div className="mb-8 space-y-3">
              <div className="flex items-center gap-3 text-muted-foreground">
                <Calendar className="h-5 w-5" />
                <span>{formatDateRange(event.startAt, event.endAt)}</span>
              </div>

              {event.location && (
                <div className="flex items-start gap-3 text-muted-foreground">
                  {event.mode === "ONLINE" ? (
                    <Globe className="h-5 w-5 mt-0.5" />
                  ) : (
                    <MapPin className="h-5 w-5 mt-0.5" />
                  )}
                  <span>{event.location}</span>
                </div>
              )}

              <div className="flex items-center gap-3 text-muted-foreground">
                <Users className="h-5 w-5" />
                <div className="flex flex-col">
                  <span>
                    {confirmedCount} inscrit{confirmedCount > 1 ? "s" : ""}
                    {event.capacity && ` / ${event.capacity} places`}
                    {spotsLeft !== null && spotsLeft > 0 && (
                      <span className="text-green-600 font-medium">
                        {" "}
                        — {spotsLeft} place{spotsLeft > 1 ? "s" : ""} restante
                        {spotsLeft > 1 ? "s" : ""}
                      </span>
                    )}
                    {isFull && (
                      <span className="text-amber-600 font-medium"> — Complet</span>
                    )}
                  </span>
                  {waitlistCount > 0 && (
                    <span className="text-sm text-amber-600">
                      <Clock className="inline h-4 w-4 mr-1" />
                      {waitlistCount} personne{waitlistCount > 1 ? "s" : ""} en liste d'attente
                    </span>
                  )}
                </div>
              </div>

              {event.organizer.name && (
                <p className="text-sm text-muted-foreground">
                  Organisé par {event.organizer.name}
                </p>
              )}
            </div>

            <Separator className="my-6" />

            {event.description && (
              <div className="prose prose-neutral max-w-none dark:prose-invert">
                <h2 className="text-xl font-semibold mb-4">À propos</h2>
                <div className="whitespace-pre-wrap">{event.description}</div>
              </div>
            )}

            {/* Map for in-person events with coordinates */}
            {event.mode === "IN_PERSON" && event.latitude && event.longitude && (
              <>
                <Separator className="my-6" />
                <div>
                  <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                    <MapPin className="h-5 w-5" />
                    Localisation
                  </h2>
                  <EventMap
                    latitude={event.latitude}
                    longitude={event.longitude}
                    location={event.location || undefined}
                    className="h-[300px]"
                  />
                  {event.location && (
                    <p className="mt-2 text-sm text-muted-foreground">{event.location}</p>
                  )}
                </div>
              </>
            )}
          </div>

          {/* Registration Form */}
          <div className="lg:col-span-2">
            <div className="sticky top-24">
            <Card className="card-3d overflow-hidden border-2 border-border">
              {/* Decorative accent */}
              <div className="h-1.5 bg-gradient-to-r from-primary via-emerald-500 to-accent" />

              <CardHeader className="relative">
                {/* Floating illustration */}
                <div className="absolute -top-2 -right-2 opacity-20">
                  <IsoTicket className="w-24 h-16" />
                </div>

                <div className="flex items-center gap-3">
                  <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-accent flex items-center justify-center">
                    <Ticket className="w-5 h-5 text-primary" />
                  </div>
                  <CardTitle>
                    {isPast
                      ? "Événement terminé"
                      : isFull && !event.waitlist
                        ? "Complet"
                        : "S'inscrire"}
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                {isPast ? (
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      Cet événement est déjà passé.
                    </AlertDescription>
                  </Alert>
                ) : isFull && !event.waitlist ? (
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      Toutes les places ont été réservées.
                    </AlertDescription>
                  </Alert>
                ) : (
                  <>
                    {isFull && event.waitlist && (
                      <Alert className="mb-4 border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-200">
                        <Clock className="h-4 w-4" />
                        <AlertDescription>
                          L'événement est complet. Vous serez inscrit en liste d'attente
                          (position #{waitlistCount + 1}).
                        </AlertDescription>
                      </Alert>
                    )}
                    {!isFull && spotsLeft !== null && spotsLeft <= 5 && spotsLeft > 0 && (
                      <Alert className="mb-4 border-green-200 bg-green-50 text-green-800 dark:border-green-800 dark:bg-green-950 dark:text-green-200">
                        <Users className="h-4 w-4" />
                        <AlertDescription>
                          Plus que {spotsLeft} place{spotsLeft > 1 ? "s" : ""} disponible{spotsLeft > 1 ? "s" : ""} !
                        </AlertDescription>
                      </Alert>
                    )}
                    <RegistrationForm eventId={event.id} />
                  </>
                )}
              </CardContent>
            </Card>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="mt-16 border-t border-border/50 bg-secondary/30">
        <div className="container mx-auto px-4 py-12">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-2.5">
              <IsoLogo className="w-6 h-8" />
              <span className="font-bold">EventLite</span>
            </div>
            <p className="text-sm text-muted-foreground">
              &copy; {new Date().getFullYear()} EventLite — Gestion d'événements simplifiée
            </p>
          </div>
        </div>
      </footer>
    </div>
    </>
  );
}
