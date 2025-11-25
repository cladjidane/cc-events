import Link from "next/link";
import { Calendar, MapPin, Users, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getPublishedEvents } from "@/actions/events";
import { formatDate } from "@/lib/utils";
import {
  IsoLogo,
  IsoCalendar,
  IsoPeople,
  IsoBlocks,
  IsoTicket,
  IsoBell,
} from "@/components/illustrations/isometric-shapes";

export default async function HomePage() {
  const events = await getPublishedEvents();

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border/50 bg-background/90 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <Link href="/" className="flex items-center gap-2.5 text-xl font-bold group">
            <div className="relative">
              <IsoLogo className="w-8 h-10 group-hover:scale-110 transition-transform" />
            </div>
            <span className="text-3d tracking-tight">EventLite</span>
          </Link>
          <nav className="flex items-center gap-4">
            <Link href="/login">
              <Button variant="outline" className="btn-3d border-2">
                Connexion
              </Button>
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden border-b">
        {/* Background effects */}
        <div className="absolute inset-0 hero-gradient" />
        <div className="absolute inset-0 iso-grid-bg opacity-50" />

        {/* Floating illustrations */}
        <div className="absolute top-16 left-16 opacity-40 animate-float hidden lg:block">
          <IsoCalendar className="w-24 h-22" />
        </div>
        <div className="absolute top-24 right-24 opacity-35 animate-float-delayed hidden lg:block">
          <IsoBlocks className="w-24 h-24" />
        </div>
        <div className="absolute bottom-16 left-1/4 opacity-30 animate-float-slow hidden lg:block">
          <IsoPeople className="w-28 h-20" />
        </div>
        <div className="absolute bottom-24 right-16 opacity-25 animate-float hidden lg:block">
          <IsoTicket className="w-24 h-16" />
        </div>
        <div className="absolute top-1/2 left-8 opacity-20 animate-float-delayed hidden xl:block">
          <IsoBell className="w-14 h-18" />
        </div>

        <div className="container relative mx-auto px-4 py-20 md:py-28">
          <div className="text-center max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent text-accent-foreground text-sm font-medium mb-6 badge-float border border-border">
              <Calendar className="w-4 h-4" />
              Gestion d'événements simplifiée
            </div>

            <h1 className="mb-6 text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl text-3d">
              Organisez vos{" "}
              <span className="relative">
                <span className="relative z-10 text-primary">événements</span>
                <span className="absolute bottom-1 left-0 right-0 h-3 bg-accent/60 -rotate-1 rounded" />
              </span>
            </h1>

            <p className="mx-auto mb-10 max-w-2xl text-lg md:text-xl text-muted-foreground leading-relaxed">
              Créez et gérez vos événements en toute simplicité.
              Inscriptions, liste d'attente, notifications — tout est automatisé.
            </p>

            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Link href="/login">
                <Button size="lg" className="btn-3d text-base px-8 py-6 bg-primary hover:bg-primary/90">
                  Commencer maintenant
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Button variant="outline" size="lg" className="text-base px-8 py-6 border-2" asChild>
                <a href="#events">
                  Voir les événements
                </a>
              </Button>
            </div>
          </div>

          {/* Feature highlights */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-16 max-w-4xl mx-auto">
            {[
              { icon: Calendar, title: "Création rapide", desc: "En quelques clics" },
              { icon: Users, title: "Gestion des participants", desc: "Inscriptions automatisées" },
              { icon: MapPin, title: "En ligne ou présentiel", desc: "Avec carte interactive" },
            ].map((feature, i) => (
              <div
                key={i}
                className="flex items-center gap-4 p-4 rounded-xl bg-card/80 backdrop-blur-sm border-2 border-border/50 shadow-sm hover:border-primary/30 transition-colors"
              >
                <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-accent flex items-center justify-center">
                  <feature.icon className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground">{feature.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Events List */}
      <main id="events" className="container mx-auto px-4 py-16">
        <div className="flex items-center justify-between mb-10">
          <div>
            <h2 className="text-3xl font-bold text-3d">Événements à venir</h2>
            <p className="text-muted-foreground mt-2">
              Découvrez et inscrivez-vous aux prochains événements
            </p>
          </div>
        </div>

        {events.length === 0 ? (
          <div className="rounded-2xl border-2 border-dashed border-border p-16 text-center bg-card/50">
            <div className="mx-auto mb-6">
              <IsoCalendar className="w-24 h-22 mx-auto opacity-50" />
            </div>
            <h3 className="mb-2 text-xl font-semibold">
              Aucun événement pour le moment
            </h3>
            <p className="text-muted-foreground max-w-md mx-auto">
              De nouveaux événements seront bientôt disponibles. Revenez nous voir !
            </p>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {events.map((event, index) => (
              <Link key={event.id} href={`/e/${event.slug}`} className="group">
                <Card className="card-3d h-full flex flex-col overflow-hidden border-2 border-border hover:border-primary/40 transition-colors bg-card">
                  {/* Card accent bar - emerald gradient */}
                  <div
                    className="h-1.5 bg-gradient-to-r from-primary via-emerald-500 to-accent"
                    style={{
                      animationDelay: `${index * 100}ms`
                    }}
                  />

                  <CardHeader className="pb-3">
                    <div className="mb-3 flex items-center gap-2 flex-wrap">
                      <Badge
                        variant={event.mode === "ONLINE" ? "secondary" : "outline"}
                        className="badge-float"
                      >
                        {event.mode === "ONLINE" ? "En ligne" : "Présentiel"}
                      </Badge>
                      {event.capacity && (
                        <Badge variant="outline" className="badge-float">
                          {event._count.registrations}/{event.capacity}
                        </Badge>
                      )}
                    </div>
                    <CardTitle className="line-clamp-2 group-hover:text-primary transition-colors">
                      {event.title}
                    </CardTitle>
                    {event.subtitle && (
                      <CardDescription className="line-clamp-2 mt-1">
                        {event.subtitle}
                      </CardDescription>
                    )}
                  </CardHeader>

                  <CardContent className="flex-1 pb-4">
                    <div className="space-y-3 text-sm">
                      <div className="flex items-center gap-3 text-muted-foreground">
                        <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-primary/5 flex items-center justify-center">
                          <Calendar className="h-4 w-4 text-primary" />
                        </div>
                        <span className="font-medium">{formatDate(event.startAt)}</span>
                      </div>
                      {event.location && (
                        <div className="flex items-center gap-3 text-muted-foreground">
                          <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-primary/5 flex items-center justify-center">
                            <MapPin className="h-4 w-4 text-primary" />
                          </div>
                          <span className="line-clamp-1">{event.location}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-3 text-muted-foreground">
                        <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-primary/5 flex items-center justify-center">
                          <Users className="h-4 w-4 text-primary" />
                        </div>
                        <span>
                          {event._count.registrations} inscrit
                          {event._count.registrations > 1 ? "s" : ""}
                        </span>
                      </div>
                    </div>
                  </CardContent>

                  <CardFooter className="pt-0">
                    <div className="w-full flex items-center justify-between py-3 px-4 -mx-4 -mb-4 bg-muted/30 border-t group-hover:bg-primary/5 transition-colors">
                      <span className="text-sm font-medium">Voir les détails</span>
                      <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
                    </div>
                  </CardFooter>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-border/50 bg-secondary/30">
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
  );
}
