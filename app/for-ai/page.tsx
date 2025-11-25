import Link from "next/link";
import {
  Calendar,
  Users,
  Bell,
  Webhook,
  BarChart3,
  Upload,
  Code,
  FileText,
  ExternalLink,
  Sparkles,
  ArrowRight,
  Copy,
  Terminal,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { IsoLogo } from "@/components/illustrations/isometric-shapes";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Pour les IA - Capacités API",
  description:
    "Découvrez comment les agents IA peuvent interagir avec EventLite via notre API REST complète.",
};

const capabilities = [
  {
    icon: Calendar,
    title: "Événements",
    description: "Créer, modifier, publier et supprimer des événements",
    endpoints: ["POST /events", "GET /events", "PATCH /events/{id}", "DELETE /events/{id}"],
    color: "text-blue-600",
    bgColor: "bg-blue-100 dark:bg-blue-900/30",
  },
  {
    icon: Users,
    title: "Inscriptions",
    description: "Gérer les participants avec liste d'attente automatique",
    endpoints: ["POST /events/{id}/registrations", "GET /events/{id}/registrations", "DELETE /events/{id}/registrations/{email}"],
    color: "text-green-600",
    bgColor: "bg-green-100 dark:bg-green-900/30",
  },
  {
    icon: Bell,
    title: "Notifications",
    description: "Envoyer des emails personnalisés aux participants",
    endpoints: ["POST /events/{id}/notify"],
    color: "text-amber-600",
    bgColor: "bg-amber-100 dark:bg-amber-900/30",
  },
  {
    icon: Webhook,
    title: "Webhooks",
    description: "Recevoir des notifications en temps réel",
    endpoints: ["POST /webhooks", "GET /webhooks", "DELETE /webhooks/{id}"],
    color: "text-purple-600",
    bgColor: "bg-purple-100 dark:bg-purple-900/30",
  },
  {
    icon: BarChart3,
    title: "Statistiques",
    description: "Consulter les métriques et analytics",
    endpoints: ["GET /stats", "GET /stats/events/{id}"],
    color: "text-pink-600",
    bgColor: "bg-pink-100 dark:bg-pink-900/30",
  },
  {
    icon: Upload,
    title: "Upload",
    description: "Téléverser des images pour les événements",
    endpoints: ["POST /upload"],
    color: "text-cyan-600",
    bgColor: "bg-cyan-100 dark:bg-cyan-900/30",
  },
];

const exampleBriefs = [
  {
    brief: "Crée un meetup IA le 15 mars à 19h au WeWork Paris, max 50 personnes",
    action: "POST /api/v1/events",
  },
  {
    brief: "Inscris alice@test.com au workshop React",
    action: "POST /api/v1/events/{id}/registrations",
  },
  {
    brief: "Envoie un rappel aux inscrits confirmés",
    action: "POST /api/v1/events/{id}/notify",
  },
  {
    brief: "Combien de personnes sont inscrites au meetup ?",
    action: "GET /api/v1/stats/events/{id}",
  },
];

export default function ForAIPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border/50 bg-background/90 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <Link href="/" className="flex items-center gap-2.5 text-xl font-bold group">
            <IsoLogo className="w-8 h-10 group-hover:scale-110 transition-transform" />
            <span className="text-3d tracking-tight">EventLite</span>
          </Link>
          <nav className="flex items-center gap-4">
            <Link href="/login">
              <Button variant="outline">Connexion</Button>
            </Link>
          </nav>
        </div>
      </header>

      <main className="container mx-auto px-4 py-12 max-w-5xl">
        {/* Hero */}
        <div className="text-center mb-12">
          <Badge className="mb-4" variant="secondary">
            <Sparkles className="w-3 h-3 mr-1" />
            AI-Ready
          </Badge>
          <h1 className="text-4xl font-bold mb-4">
            Capacités IA d'EventLite
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Notre API REST permet aux agents IA de créer des événements, gérer des inscriptions
            et envoyer des notifications en langage naturel.
          </p>
        </div>

        {/* Quick Links */}
        <div className="grid gap-4 md:grid-cols-3 mb-12">
          <Card className="border-2 hover:border-primary/50 transition-colors">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <FileText className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-base">llms.txt</CardTitle>
                  <CardDescription>Index pour LLM</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Link href="/llms.txt" target="_blank">
                <Button variant="outline" size="sm" className="w-full">
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Ouvrir
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="border-2 hover:border-primary/50 transition-colors">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Code className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-base">llms-full.txt</CardTitle>
                  <CardDescription>Documentation complète</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Link href="/llms-full.txt" target="_blank">
                <Button variant="outline" size="sm" className="w-full">
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Ouvrir
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="border-2 hover:border-primary/50 transition-colors">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Terminal className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-base">OpenAPI</CardTitle>
                  <CardDescription>Spécification machine</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Link href="/api/v1/openapi" target="_blank">
                <Button variant="outline" size="sm" className="w-full">
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Ouvrir
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>

        <Separator className="my-12" />

        {/* Capabilities */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold mb-6">Fonctionnalités API</h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {capabilities.map((cap) => (
              <Card key={cap.title} className="overflow-hidden">
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-lg ${cap.bgColor} flex items-center justify-center`}>
                      <cap.icon className={`w-5 h-5 ${cap.color}`} />
                    </div>
                    <CardTitle className="text-lg">{cap.title}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-3">
                    {cap.description}
                  </p>
                  <div className="space-y-1">
                    {cap.endpoints.map((endpoint) => (
                      <code
                        key={endpoint}
                        className="block text-xs bg-muted px-2 py-1 rounded font-mono"
                      >
                        {endpoint}
                      </code>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        <Separator className="my-12" />

        {/* Example Briefs */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold mb-2">Exemples de requêtes</h2>
          <p className="text-muted-foreground mb-6">
            Voici comment un LLM peut transformer des instructions en langage naturel en appels API.
          </p>
          <div className="space-y-4">
            {exampleBriefs.map((example, i) => (
              <div
                key={i}
                className="flex flex-col md:flex-row md:items-center gap-3 p-4 rounded-lg border bg-card"
              >
                <div className="flex-1">
                  <p className="text-sm font-medium mb-1">Brief utilisateur :</p>
                  <p className="text-muted-foreground italic">"{example.brief}"</p>
                </div>
                <ArrowRight className="hidden md:block w-5 h-5 text-muted-foreground flex-shrink-0" />
                <div className="md:w-64">
                  <p className="text-sm font-medium mb-1">Action API :</p>
                  <code className="text-sm bg-primary/10 text-primary px-2 py-1 rounded font-mono">
                    {example.action}
                  </code>
                </div>
              </div>
            ))}
          </div>
        </div>

        <Separator className="my-12" />

        {/* Authentication */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold mb-2">Authentification</h2>
          <p className="text-muted-foreground mb-6">
            Toutes les requêtes API nécessitent un Bearer Token.
          </p>
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-4">
                <div>
                  <p className="text-sm font-medium mb-2">Générer une API Key :</p>
                  <div className="bg-muted p-3 rounded-lg font-mono text-sm overflow-x-auto">
                    <code>base64(email:NEXTAUTH_SECRET)</code>
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium mb-2">Utilisation dans les headers :</p>
                  <div className="bg-muted p-3 rounded-lg font-mono text-sm overflow-x-auto">
                    <code>Authorization: Bearer &lt;API_KEY&gt;</code>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* CTA */}
        <div className="text-center py-12 px-6 rounded-2xl bg-primary/5 border">
          <h2 className="text-2xl font-bold mb-3">Prêt à intégrer ?</h2>
          <p className="text-muted-foreground mb-6 max-w-lg mx-auto">
            Consultez la documentation complète ou testez directement l'API avec votre agent IA.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/llms-full.txt" target="_blank">
              <Button size="lg">
                <FileText className="w-4 h-4 mr-2" />
                Documentation complète
              </Button>
            </Link>
            <Link href="/register">
              <Button variant="outline" size="lg">
                Créer un compte
              </Button>
            </Link>
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
  );
}
