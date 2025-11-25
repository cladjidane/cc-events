import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { Check, X, Calendar, MapPin, Users, FileEdit } from "lucide-react";
import { db } from "@/lib/db";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { IsoLogo } from "@/components/illustrations/isometric-shapes";

type Props = {
  params: Promise<{ token: string }>;
  searchParams: Promise<{ action?: string }>;
};

function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

async function getUniqueSlug(baseSlug: string): Promise<string> {
  let slug = baseSlug;
  let counter = 1;

  while (await db.event.findUnique({ where: { slug } })) {
    slug = `${baseSlug}-${counter}`;
    counter++;
  }

  return slug;
}

export default async function ApprovePage({ params, searchParams }: Props) {
  const { token } = await params;
  const { action } = await searchParams;

  // Trouver le PendingEvent
  const pendingEvent = await db.pendingEvent.findUnique({
    where: { approvalToken: token },
  });

  if (!pendingEvent) {
    notFound();
  }

  // Vérifier l'expiration
  if (pendingEvent.approvalExpires < new Date()) {
    // Supprimer l'événement expiré
    await db.pendingEvent.delete({ where: { id: pendingEvent.id } });

    return (
      <PageLayout>
        <Card className="border-2 border-destructive/50">
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mb-4">
              <X className="w-8 h-8 text-destructive" />
            </div>
            <CardTitle className="text-2xl">Lien expiré</CardTitle>
            <CardDescription>
              Ce lien de validation a expiré (24h). Veuillez créer une nouvelle demande.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Button asChild>
              <Link href="/create-with-ai">Créer un nouvel événement</Link>
            </Button>
          </CardContent>
        </Card>
      </PageLayout>
    );
  }

  // Traiter l'action si présente
  if (action === "publish" || action === "draft" || action === "reject") {
    if (action === "reject") {
      // Supprimer la demande
      await db.pendingEvent.delete({ where: { id: pendingEvent.id } });

      return (
        <PageLayout>
          <Card className="border-2">
            <CardHeader className="text-center">
              <div className="mx-auto w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                <X className="w-8 h-8 text-muted-foreground" />
              </div>
              <CardTitle className="text-2xl">Demande refusée</CardTitle>
              <CardDescription>
                L'événement a été supprimé et ne sera pas créé.
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <Button asChild variant="outline">
                <Link href="/">Retour à l'accueil</Link>
              </Button>
            </CardContent>
          </Card>
        </PageLayout>
      );
    }

    // Créer l'événement
    // Récupérer l'utilisateur (doit exister, vérifié à la création de la demande)
    const user = await db.user.findUnique({
      where: { email: pendingEvent.email },
    });

    if (!user) {
      // Ne devrait pas arriver, mais au cas où
      await db.pendingEvent.delete({ where: { id: pendingEvent.id } });
      return (
        <PageLayout>
          <Card className="border-2 border-destructive/50">
            <CardHeader className="text-center">
              <div className="mx-auto w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mb-4">
                <X className="w-8 h-8 text-destructive" />
              </div>
              <CardTitle className="text-2xl">Compte introuvable</CardTitle>
              <CardDescription>
                Le compte associé à cette demande n'existe plus.
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <Button asChild>
                <Link href="/login">Se connecter</Link>
              </Button>
            </CardContent>
          </Card>
        </PageLayout>
      );
    }

    // Générer le slug
    const baseSlug = generateSlug(pendingEvent.title);
    const slug = await getUniqueSlug(baseSlug);

    // Calculer endAt si non fourni (startAt + 2h)
    const endAt =
      pendingEvent.endAt ||
      new Date(pendingEvent.startAt.getTime() + 2 * 60 * 60 * 1000);

    // Créer l'événement
    const event = await db.event.create({
      data: {
        slug,
        organizerId: user.id,
        title: pendingEvent.title,
        subtitle: pendingEvent.subtitle,
        description: pendingEvent.description,
        mode: pendingEvent.mode,
        location: pendingEvent.location,
        startAt: pendingEvent.startAt,
        endAt,
        timezone: "Europe/Paris",
        capacity: pendingEvent.capacity,
        waitlist: true,
        status: action === "publish" ? "PUBLISHED" : "DRAFT",
      },
    });

    // Supprimer le PendingEvent
    await db.pendingEvent.delete({ where: { id: pendingEvent.id } });

    // Rediriger
    if (action === "publish") {
      redirect(`/e/${event.slug}`);
    } else {
      redirect(`/dashboard/events/${event.id}`);
    }
  }

  // Afficher la page de confirmation
  const formatDate = (date: Date) => {
    return date.toLocaleString("fr-FR", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <PageLayout>
      <Card className="border-2">
        <CardHeader>
          <CardTitle className="text-2xl">Valider l'événement</CardTitle>
          <CardDescription>
            Vérifiez les informations et choisissez une action
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Event details */}
          <div className="space-y-4">
            <div>
              <h3 className="text-xl font-semibold">{pendingEvent.title}</h3>
              {pendingEvent.subtitle && (
                <p className="text-muted-foreground">{pendingEvent.subtitle}</p>
              )}
            </div>

            {pendingEvent.description && (
              <p className="text-sm text-muted-foreground bg-muted/50 p-3 rounded-lg">
                {pendingEvent.description}
              </p>
            )}

            <div className="grid gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Calendar className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Date et heure</p>
                  <p className="font-medium">{formatDate(pendingEvent.startAt)}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <MapPin className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Lieu</p>
                  <div className="flex items-center gap-2">
                    <p className="font-medium">
                      {pendingEvent.location ||
                        (pendingEvent.mode === "ONLINE" ? "En ligne" : "Non précisé")}
                    </p>
                    <Badge
                      variant={pendingEvent.mode === "ONLINE" ? "secondary" : "outline"}
                    >
                      {pendingEvent.mode === "ONLINE" ? "En ligne" : "Présentiel"}
                    </Badge>
                  </div>
                </div>
              </div>

              {pendingEvent.capacity && (
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Users className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Capacité</p>
                    <p className="font-medium">{pendingEvent.capacity} personnes max</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="space-y-3 pt-4 border-t">
            <Button asChild className="w-full" size="lg">
              <Link href={`/approve/${token}?action=publish`}>
                <Check className="w-4 h-4 mr-2" />
                Publier l'événement
              </Link>
            </Button>

            <Button asChild variant="secondary" className="w-full">
              <Link href={`/approve/${token}?action=draft`}>
                <FileEdit className="w-4 h-4 mr-2" />
                Enregistrer en brouillon
              </Link>
            </Button>

            <Button asChild variant="ghost" className="w-full text-destructive">
              <Link href={`/approve/${token}?action=reject`}>
                <X className="w-4 h-4 mr-2" />
                Refuser et supprimer
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </PageLayout>
  );
}

function PageLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border/50 bg-background/90 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <Link
            href="/"
            className="flex items-center gap-2.5 text-xl font-bold group"
          >
            <div className="relative">
              <IsoLogo className="w-8 h-10 group-hover:scale-110 transition-transform" />
            </div>
            <span className="text-3d tracking-tight">EventLite</span>
          </Link>
        </div>
      </header>

      <main className="container mx-auto px-4 py-12 max-w-lg">{children}</main>
    </div>
  );
}
