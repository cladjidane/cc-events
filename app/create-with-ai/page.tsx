"use client";

import { useState } from "react";
import Link from "next/link";
import { Sparkles, ArrowRight, Loader2, Calendar, MapPin, Users, Clock, Check, Edit3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { IsoLogo } from "@/components/illustrations/isometric-shapes";

type ParsedEvent = {
  title: string;
  subtitle?: string;
  description?: string;
  mode: "IN_PERSON" | "ONLINE";
  location?: string;
  startAt: string;
  endAt?: string;
  capacity?: number;
};

type Step = "brief" | "review" | "email" | "done";

export default function CreateWithAIPage() {
  const [step, setStep] = useState<Step>("brief");
  const [brief, setBrief] = useState("");
  const [parsed, setParsed] = useState<ParsedEvent | null>(null);
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleParseBrief = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/v1/events/parse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ brief }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Erreur lors de l'analyse");
      }

      setParsed(data.data.parsed);
      setStep("review");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inconnue");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmitRequest = async () => {
    if (!parsed || !email) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/v1/events/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          ...parsed,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Erreur lors de la soumission");
      }

      setStep("done");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inconnue");
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (isoString: string) => {
    try {
      return new Date(isoString).toLocaleString("fr-FR", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return isoString;
    }
  };

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

      <main className="container mx-auto px-4 py-12 max-w-2xl">
        {/* Progress indicator */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {[
            { key: "brief" as const, label: "Brief" },
            { key: "review" as const, label: "Vérification" },
            { key: "email" as const, label: "Validation" },
          ].map((s, i) => {
            const stepOrder = { brief: 0, review: 1, email: 2, done: 3 };
            const currentOrder = stepOrder[step];
            const itemOrder = stepOrder[s.key];
            const isCompleted = currentOrder > itemOrder;
            const isCurrent = step === s.key;

            return (
              <div key={s.key} className="flex items-center">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                    isCurrent
                      ? "bg-primary text-primary-foreground"
                      : isCompleted
                      ? "bg-primary/20 text-primary"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {isCompleted ? <Check className="w-4 h-4" /> : i + 1}
                </div>
                {i < 2 && (
                  <div
                    className={`w-12 h-0.5 mx-2 ${
                      isCompleted ? "bg-primary/40" : "bg-muted"
                    }`}
                  />
                )}
              </div>
            );
          })}
        </div>

        {/* Step: Brief */}
        {step === "brief" && (
          <Card className="border-2">
            <CardHeader className="text-center">
              <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <Sparkles className="w-6 h-6 text-primary" />
              </div>
              <CardTitle className="text-2xl">Créer un événement avec l'IA</CardTitle>
              <CardDescription className="text-base">
                Décrivez votre événement en quelques phrases, l'IA s'occupe du reste
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="brief">Votre brief</Label>
                <Textarea
                  id="brief"
                  value={brief}
                  onChange={(e) => setBrief(e.target.value)}
                  placeholder="Ex: Organise un meetup IA le 15 mars à 19h au WeWork Paris, max 50 personnes, pour parler des agents autonomes et du futur de l'IA..."
                  rows={6}
                  className="resize-none"
                />
                <p className="text-xs text-muted-foreground">
                  Incluez : titre, date, heure, lieu (ou en ligne), capacité, description...
                </p>
              </div>

              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <Button
                onClick={handleParseBrief}
                disabled={brief.length < 10 || isLoading}
                className="w-full"
                size="lg"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Analyse en cours...
                  </>
                ) : (
                  <>
                    Analyser avec l'IA
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>

              <div className="pt-4 border-t">
                <p className="text-sm text-muted-foreground text-center">
                  Exemples de briefs :
                </p>
                <div className="mt-3 space-y-2">
                  {[
                    "Workshop React le 20 mars à 14h chez Google Paris, 30 places",
                    "Webinar gratuit sur le SEO, jeudi prochain à 18h en ligne",
                    "Afterwork networking pour startups, vendredi 28 février à 19h au Bar Le Central",
                  ].map((example, i) => (
                    <button
                      key={i}
                      onClick={() => setBrief(example)}
                      className="w-full text-left text-sm p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                    >
                      "{example}"
                    </button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step: Review */}
        {step === "review" && parsed && (
          <Card className="border-2">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-2xl">Vérifiez les informations</CardTitle>
                  <CardDescription>
                    Voici ce que l'IA a compris de votre brief
                  </CardDescription>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setStep("brief")}
                >
                  <Edit3 className="w-4 h-4 mr-2" />
                  Modifier
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div>
                  <h3 className="text-xl font-semibold">{parsed.title}</h3>
                  {parsed.subtitle && (
                    <p className="text-muted-foreground">{parsed.subtitle}</p>
                  )}
                </div>

                {parsed.description && (
                  <p className="text-sm text-muted-foreground bg-muted/50 p-3 rounded-lg">
                    {parsed.description}
                  </p>
                )}

                <div className="grid gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Calendar className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Date et heure</p>
                      <p className="font-medium">{formatDate(parsed.startAt)}</p>
                    </div>
                  </div>

                  {parsed.endAt && (
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Clock className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Fin</p>
                        <p className="font-medium">{formatDate(parsed.endAt)}</p>
                      </div>
                    </div>
                  )}

                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <MapPin className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Lieu</p>
                      <div className="flex items-center gap-2">
                        <p className="font-medium">
                          {parsed.location || (parsed.mode === "ONLINE" ? "En ligne" : "Non précisé")}
                        </p>
                        <Badge variant={parsed.mode === "ONLINE" ? "secondary" : "outline"}>
                          {parsed.mode === "ONLINE" ? "En ligne" : "Présentiel"}
                        </Badge>
                      </div>
                    </div>
                  </div>

                  {parsed.capacity && (
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Users className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Capacité</p>
                        <p className="font-medium">{parsed.capacity} personnes max</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => setStep("brief")}
                  className="flex-1"
                >
                  Recommencer
                </Button>
                <Button
                  onClick={() => setStep("email")}
                  className="flex-1"
                >
                  C'est correct
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step: Email */}
        {step === "email" && parsed && (
          <Card className="border-2">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl">Dernière étape</CardTitle>
              <CardDescription className="text-base">
                Entrez votre email pour recevoir un lien de validation
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="email">Votre email (compte existant)</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="vous@example.com"
                />
                <p className="text-xs text-muted-foreground">
                  Vous recevrez un email avec un lien pour valider et publier votre événement.
                  <strong> Un compte EventLite est requis.</strong>{" "}
                  <Link href="/login" className="text-primary underline">
                    Créer un compte
                  </Link>
                </p>
              </div>

              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => setStep("review")}
                  className="flex-1"
                >
                  Retour
                </Button>
                <Button
                  onClick={handleSubmitRequest}
                  disabled={!email || isLoading}
                  className="flex-1"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Envoi...
                    </>
                  ) : (
                    <>
                      Envoyer le lien
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step: Done */}
        {step === "done" && (
          <Card className="border-2">
            <CardHeader className="text-center">
              <div className="mx-auto w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mb-4">
                <Check className="w-8 h-8 text-green-600 dark:text-green-400" />
              </div>
              <CardTitle className="text-2xl">Email envoyé !</CardTitle>
              <CardDescription className="text-base">
                Vérifiez votre boîte mail pour valider votre événement
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="bg-muted/50 p-4 rounded-lg text-center">
                <p className="text-sm text-muted-foreground mb-2">
                  Un email a été envoyé à
                </p>
                <p className="font-medium">{email}</p>
              </div>

              <p className="text-sm text-muted-foreground text-center">
                Cliquez sur le lien dans l'email pour valider et publier votre événement.
                Le lien expire dans 24 heures.
              </p>

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => {
                    setBrief("");
                    setParsed(null);
                    setEmail("");
                    setStep("brief");
                  }}
                  className="flex-1"
                >
                  Créer un autre événement
                </Button>
                <Button asChild className="flex-1">
                  <Link href="/">
                    Retour à l'accueil
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}
