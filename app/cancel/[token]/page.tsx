import Link from "next/link";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { cancelRegistration } from "@/actions/register";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { CheckCircle2, XCircle, ArrowLeft } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Annuler mon inscription",
};

type Props = {
  params: Promise<{ token: string }>;
  searchParams: Promise<{ confirm?: string }>;
};

export default async function CancelPage({ params, searchParams }: Props) {
  const { token } = await params;
  const { confirm } = await searchParams;

  const registration = await db.registration.findUnique({
    where: { cancelToken: token },
    include: { event: true },
  });

  if (!registration) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/50 px-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <XCircle className="mx-auto h-12 w-12 text-destructive" />
            <CardTitle>Lien invalide</CardTitle>
            <CardDescription>
              Ce lien d'annulation n'existe pas ou a expiré.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/">
              <Button variant="outline" className="w-full">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Retour à l'accueil
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Si déjà annulé
  if (registration.status === "CANCELLED") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/50 px-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CheckCircle2 className="mx-auto h-12 w-12 text-muted-foreground" />
            <CardTitle>Inscription déjà annulée</CardTitle>
            <CardDescription>
              Votre inscription à "{registration.event.title}" a déjà été annulée.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href={`/e/${registration.event.slug}`}>
              <Button variant="outline" className="w-full">
                Voir l'événement
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Si confirmation demandée, annuler
  if (confirm === "true") {
    const result = await cancelRegistration(token);

    if (result.success) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-muted/50 px-4">
          <Card className="w-full max-w-md">
            <CardHeader className="text-center">
              <CheckCircle2 className="mx-auto h-12 w-12 text-green-600" />
              <CardTitle>Inscription annulée</CardTitle>
              <CardDescription>
                Votre inscription à "{registration.event.title}" a été annulée
                avec succès.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-center text-sm text-muted-foreground">
                Vous pouvez vous réinscrire à tout moment si des places sont
                disponibles.
              </p>
              <Link href={`/e/${registration.event.slug}`}>
                <Button variant="outline" className="w-full">
                  Voir l'événement
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      );
    }

    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/50 px-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <XCircle className="mx-auto h-12 w-12 text-destructive" />
            <CardTitle>Erreur</CardTitle>
            <CardDescription>{result.error}</CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/">
              <Button variant="outline" className="w-full">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Retour à l'accueil
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Page de confirmation
  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/50 px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle>Confirmer l'annulation</CardTitle>
          <CardDescription>
            Voulez-vous vraiment annuler votre inscription à "{registration.event.title}" ?
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-lg bg-muted p-4 text-sm">
            <p>
              <strong>Participant :</strong> {registration.firstName}{" "}
              {registration.lastName}
            </p>
            <p>
              <strong>Email :</strong> {registration.email}
            </p>
            <p>
              <strong>Statut :</strong>{" "}
              {registration.status === "CONFIRMED"
                ? "Confirmé"
                : "Liste d'attente"}
            </p>
          </div>

          <div className="flex gap-3">
            <Link href={`/e/${registration.event.slug}`} className="flex-1">
              <Button variant="outline" className="w-full">
                Annuler
              </Button>
            </Link>
            <Link href={`/cancel/${token}?confirm=true`} className="flex-1">
              <Button variant="destructive" className="w-full">
                Confirmer
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
