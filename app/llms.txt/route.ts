import { NextRequest } from "next/server";

const llmsTxt = `# EventLite

> Plateforme de gestion d'événements avec API REST complète. Créez des événements, gérez les inscriptions et envoyez des notifications.

## Documentation

- [Documentation API complète](/llms-full.txt): Guide complet pour utiliser l'API EventLite
- [Spécification OpenAPI](/api/v1/openapi): Schéma machine-readable de l'API

## Fonctionnalités principales

- **Événements** : Créer, modifier, publier des événements (présentiel ou en ligne)
- **Inscriptions** : Gérer les participants avec capacité et liste d'attente automatique
- **Notifications** : Envoyer des emails personnalisés aux participants
- **Webhooks** : Recevoir des notifications en temps réel
- **Statistiques** : Suivre les métriques de vos événements

## Authentification

API Key au format Bearer Token. Générer avec : \`base64(email:NEXTAUTH_SECRET)\`
`;

/**
 * GET /llms.txt
 * Index de navigation pour les LLM
 */
export async function GET(request: NextRequest) {
  const host = request.headers.get("host") || "localhost:3333";
  const protocol = host.includes("localhost") ? "http" : "https";
  const baseUrl = `${protocol}://${host}`;

  // Remplacer les URLs relatives par des URLs absolues
  const content = llmsTxt.replace(/\]\(\//g, `](${baseUrl}/`);

  return new Response(content, {
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
