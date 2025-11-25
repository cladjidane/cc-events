"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Sparkles,
  ArrowRight,
  ArrowLeft,
  Loader2,
  Calendar,
  MapPin,
  Users,
  Clock,
  Check,
  Edit3,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
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
import { createEventFromAI } from "@/actions/events";

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

type Step = "brief" | "review";

export default function NewAIEventPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("brief");
  const [brief, setBrief] = useState("");
  const [parsed, setParsed] = useState<ParsedEvent | null>(null);
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

  const handleCreateEvent = async (status: "DRAFT" | "PUBLISHED") => {
    if (!parsed) return;

    setIsLoading(true);
    setError(null);

    try {
      const result = await createEventFromAI({
        ...parsed,
        status,
      });

      if (!result.success) {
        throw new Error(result.error || "Erreur lors de la création");
      }

      router.push(`/dashboard/events/${result.data?.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inconnue");
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
    <div className="max-w-2xl">
      <Link
        href="/dashboard/events"
        className="mb-6 inline-flex items-center text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Retour aux événements
      </Link>

      {/* Progress indicator */}
      <div className="flex items-center gap-2 mb-6">
        {[
          { key: "brief" as const, label: "Brief" },
          { key: "review" as const, label: "Vérification" },
        ].map((s, i) => {
          const stepOrder = { brief: 0, review: 1 };
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
              <span className="ml-2 text-sm">{s.label}</span>
              {i < 1 && (
                <div
                  className={`w-8 h-0.5 mx-3 ${
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
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-primary" />
              </div>
              <div>
                <CardTitle>Créer avec l'IA</CardTitle>
                <CardDescription>
                  Décrivez votre événement, l'IA structure les informations
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="brief">Votre brief</Label>
              <Textarea
                id="brief"
                value={brief}
                onChange={(e) => setBrief(e.target.value)}
                placeholder="Ex: Meetup IA le 15 mars à 19h au WeWork Paris, max 50 personnes, pour parler des agents autonomes..."
                rows={5}
                className="resize-none"
              />
              <p className="text-xs text-muted-foreground">
                Incluez : titre, date, heure, lieu (ou en ligne), capacité,
                description...
              </p>
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="flex gap-3">
              <Button variant="outline" asChild className="flex-1">
                <Link href="/dashboard/events/new">Formulaire classique</Link>
              </Button>
              <Button
                onClick={handleParseBrief}
                disabled={brief.length < 10 || isLoading}
                className="flex-1"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Analyse...
                  </>
                ) : (
                  <>
                    Analyser
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            </div>

            <div className="pt-4 border-t">
              <p className="text-sm text-muted-foreground mb-3">Exemples :</p>
              <div className="space-y-2">
                {[
                  "Workshop React le 20 mars à 14h chez Google Paris, 30 places",
                  "Webinar SEO jeudi prochain à 18h en ligne",
                  "Afterwork networking vendredi 28 à 19h au Bar Le Central",
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
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Vérifiez les informations</CardTitle>
                <CardDescription>
                  Voici ce que l'IA a compris de votre brief
                </CardDescription>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setStep("brief")}>
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
                        {parsed.location ||
                          (parsed.mode === "ONLINE" ? "En ligne" : "Non précisé")}
                      </p>
                      <Badge
                        variant={parsed.mode === "ONLINE" ? "secondary" : "outline"}
                      >
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
                onClick={() => handleCreateEvent("DRAFT")}
                disabled={isLoading}
                className="flex-1"
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  "Enregistrer en brouillon"
                )}
              </Button>
              <Button
                onClick={() => handleCreateEvent("PUBLISHED")}
                disabled={isLoading}
                className="flex-1"
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    Publier
                    <Check className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
