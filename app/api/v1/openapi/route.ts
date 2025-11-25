import { NextRequest } from "next/server";

const openApiSpec = {
  openapi: "3.1.0",
  info: {
    title: "EventLite API",
    description: `
API REST pour la gestion d'événements EventLite.

## Authentification

Toutes les requêtes doivent inclure un header Authorization avec une API Key:

\`\`\`
Authorization: Bearer <API_KEY>
\`\`\`

L'API Key est générée en encodant en base64: \`email:NEXTAUTH_SECRET\`

Exemple en JavaScript:
\`\`\`javascript
const apiKey = btoa(\`admin@eventlite.fr:\${process.env.NEXTAUTH_SECRET}\`);
\`\`\`

## Workflow typique pour créer un événement

1. **Upload de l'image** (optionnel): POST /api/v1/upload
2. **Créer l'événement**: POST /api/v1/events
3. **Publier**: PATCH /api/v1/events/:id avec { "status": "PUBLISHED" }

## Formats de date

Toutes les dates sont en ISO 8601: \`2025-01-15T14:00:00.000Z\`
    `.trim(),
    version: "1.0.0",
    contact: {
      name: "EventLite API Support",
    },
  },
  servers: [
    {
      url: "{baseUrl}",
      variables: {
        baseUrl: {
          default: "https://your-app.vercel.app",
          description: "Base URL of the API",
        },
      },
    },
  ],
  security: [{ bearerAuth: [] }],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: "http",
        scheme: "bearer",
        description: "API Key encodée en base64 (format: email:NEXTAUTH_SECRET)",
      },
    },
    schemas: {
      Event: {
        type: "object",
        properties: {
          id: { type: "string", format: "uuid", description: "Identifiant unique" },
          slug: { type: "string", description: "URL-friendly identifier" },
          title: { type: "string", description: "Titre de l'événement", maxLength: 100 },
          subtitle: { type: "string", nullable: true, description: "Sous-titre optionnel", maxLength: 200 },
          description: { type: "string", nullable: true, description: "Description détaillée", maxLength: 5000 },
          coverImage: { type: "string", nullable: true, description: "URL de l'image de couverture" },
          mode: {
            type: "string",
            enum: ["IN_PERSON", "ONLINE"],
            description: "IN_PERSON = présentiel, ONLINE = en ligne"
          },
          location: { type: "string", nullable: true, description: "Adresse ou lien visio" },
          latitude: { type: "number", nullable: true, description: "Latitude GPS (pour présentiel)" },
          longitude: { type: "number", nullable: true, description: "Longitude GPS (pour présentiel)" },
          startAt: { type: "string", format: "date-time", description: "Date/heure de début (ISO 8601)" },
          endAt: { type: "string", format: "date-time", description: "Date/heure de fin (ISO 8601)" },
          timezone: { type: "string", default: "Europe/Paris" },
          capacity: { type: "integer", nullable: true, description: "Nombre max de participants (null = illimité)" },
          waitlist: { type: "boolean", default: true, description: "Activer la liste d'attente" },
          status: {
            type: "string",
            enum: ["DRAFT", "PUBLISHED", "CLOSED", "CANCELLED"],
            default: "DRAFT",
            description: "DRAFT = brouillon, PUBLISHED = visible publiquement"
          },
          organizerId: { type: "string", format: "uuid" },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" },
        },
        required: ["id", "slug", "title", "mode", "startAt", "endAt", "status"],
      },
      EventCreate: {
        type: "object",
        properties: {
          title: { type: "string", description: "Titre de l'événement (3-100 caractères)", minLength: 3, maxLength: 100 },
          subtitle: { type: "string", description: "Sous-titre optionnel", maxLength: 200 },
          description: { type: "string", description: "Description détaillée de l'événement" },
          coverImage: { type: "string", format: "uri", description: "URL de l'image (utiliser /api/v1/upload d'abord)" },
          mode: { type: "string", enum: ["IN_PERSON", "ONLINE"], description: "Type d'événement" },
          location: { type: "string", description: "Adresse physique ou lien de visioconférence" },
          latitude: { type: "number", description: "Latitude pour les événements en présentiel" },
          longitude: { type: "number", description: "Longitude pour les événements en présentiel" },
          startAt: { type: "string", format: "date-time", description: "Date/heure de début. endAt sera calculé automatiquement (+2h) si non fourni" },
          endAt: { type: "string", format: "date-time", description: "Date/heure de fin (optionnel, défaut: startAt + 2h)" },
          capacity: { type: "integer", minimum: 1, description: "Capacité max (omettre pour illimité)" },
          waitlist: { type: "boolean", default: true, description: "Activer la liste d'attente quand complet" },
          status: { type: "string", enum: ["DRAFT", "PUBLISHED"], default: "DRAFT" },
        },
        required: ["title", "mode", "startAt"],
        example: {
          title: "Meetup IA & Développement",
          subtitle: "Découvrez les dernières avancées en IA",
          description: "Rejoignez-nous pour une soirée dédiée à l'IA...",
          mode: "IN_PERSON",
          location: "42 rue de la Tech, 75001 Paris",
          latitude: 48.8566,
          longitude: 2.3522,
          startAt: "2025-02-15T19:00:00.000Z",
          capacity: 50,
          waitlist: true,
          status: "DRAFT",
        },
      },
      EventUpdate: {
        type: "object",
        description: "Tous les champs sont optionnels. Seuls les champs fournis seront mis à jour.",
        properties: {
          title: { type: "string", minLength: 3, maxLength: 100 },
          subtitle: { type: "string", maxLength: 200 },
          description: { type: "string" },
          coverImage: { type: "string", format: "uri" },
          mode: { type: "string", enum: ["IN_PERSON", "ONLINE"] },
          location: { type: "string" },
          latitude: { type: "number" },
          longitude: { type: "number" },
          startAt: { type: "string", format: "date-time" },
          endAt: { type: "string", format: "date-time" },
          capacity: { type: "integer", minimum: 1 },
          waitlist: { type: "boolean" },
          status: { type: "string", enum: ["DRAFT", "PUBLISHED", "CLOSED", "CANCELLED"] },
        },
        example: {
          status: "PUBLISHED",
        },
      },
      UploadResponse: {
        type: "object",
        properties: {
          data: {
            type: "object",
            properties: {
              url: { type: "string", format: "uri", description: "URL publique de l'image uploadée" },
              pathname: { type: "string", description: "Chemin du fichier" },
            },
          },
        },
      },
      Error: {
        type: "object",
        properties: {
          error: { type: "string", description: "Message d'erreur" },
        },
      },
    },
  },
  paths: {
    "/api/v1/events": {
      get: {
        summary: "Lister les événements",
        description: "Retourne tous les événements de l'utilisateur authentifié. Les admins voient tous les événements.",
        tags: ["Events"],
        parameters: [
          {
            name: "status",
            in: "query",
            schema: { type: "string", enum: ["DRAFT", "PUBLISHED", "CLOSED", "CANCELLED"] },
            description: "Filtrer par statut",
          },
          {
            name: "limit",
            in: "query",
            schema: { type: "integer", default: 50, maximum: 100 },
            description: "Nombre max de résultats",
          },
          {
            name: "offset",
            in: "query",
            schema: { type: "integer", default: 0 },
            description: "Offset pour pagination",
          },
        ],
        responses: {
          "200": {
            description: "Liste des événements",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    data: { type: "array", items: { $ref: "#/components/schemas/Event" } },
                    pagination: {
                      type: "object",
                      properties: {
                        total: { type: "integer" },
                        limit: { type: "integer" },
                        offset: { type: "integer" },
                        has_more: { type: "boolean" },
                      },
                    },
                  },
                },
              },
            },
          },
          "401": { description: "Non authentifié" },
        },
      },
      post: {
        summary: "Créer un événement",
        description: "Crée un nouvel événement. Le slug est généré automatiquement à partir du titre.",
        tags: ["Events"],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/EventCreate" },
            },
          },
        },
        responses: {
          "201": {
            description: "Événement créé",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    data: { $ref: "#/components/schemas/Event" },
                  },
                },
              },
            },
          },
          "400": { description: "Données invalides" },
          "401": { description: "Non authentifié" },
        },
      },
    },
    "/api/v1/events/{id}": {
      get: {
        summary: "Récupérer un événement",
        description: "Récupère un événement par son ID ou son slug. Inclut les compteurs d'inscriptions.",
        tags: ["Events"],
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "string" },
            description: "ID (UUID) ou slug de l'événement",
          },
        ],
        responses: {
          "200": {
            description: "Détails de l'événement",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    data: {
                      allOf: [
                        { $ref: "#/components/schemas/Event" },
                        {
                          type: "object",
                          properties: {
                            confirmed_count: { type: "integer", description: "Nombre d'inscrits confirmés" },
                            waitlist_count: { type: "integer", description: "Nombre en liste d'attente" },
                            total_registrations: { type: "integer" },
                          },
                        },
                      ],
                    },
                  },
                },
              },
            },
          },
          "404": { description: "Événement non trouvé" },
        },
      },
      patch: {
        summary: "Mettre à jour un événement",
        description: "Met à jour partiellement un événement. Seuls les champs fournis sont modifiés.",
        tags: ["Events"],
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "string" },
          },
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/EventUpdate" },
            },
          },
        },
        responses: {
          "200": {
            description: "Événement mis à jour",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    data: { $ref: "#/components/schemas/Event" },
                  },
                },
              },
            },
          },
          "403": { description: "Non autorisé à modifier cet événement" },
          "404": { description: "Événement non trouvé" },
        },
      },
      delete: {
        summary: "Supprimer un événement",
        description: "Supprime définitivement un événement et toutes ses inscriptions.",
        tags: ["Events"],
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "string" },
          },
        ],
        responses: {
          "200": {
            description: "Événement supprimé",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    message: { type: "string" },
                  },
                },
              },
            },
          },
          "403": { description: "Non autorisé" },
          "404": { description: "Événement non trouvé" },
        },
      },
    },
    "/api/v1/upload": {
      post: {
        summary: "Uploader une image",
        description: `
Upload une image pour l'utiliser comme couverture d'événement.

**3 méthodes supportées:**

1. **Fichier direct** (multipart/form-data):
   \`\`\`
   curl -X POST -H "Authorization: Bearer $API_KEY" \\
     -F "file=@image.jpg" \\
     https://your-app.vercel.app/api/v1/upload
   \`\`\`

2. **URL externe** (application/json):
   \`\`\`json
   { "url": "https://example.com/image.jpg" }
   \`\`\`

3. **Base64** (application/json):
   \`\`\`json
   { "base64": "data:image/png;base64,iVBORw0KGgo..." }
   \`\`\`

L'URL retournée peut ensuite être utilisée dans le champ \`coverImage\` lors de la création d'événement.
        `.trim(),
        tags: ["Upload"],
        requestBody: {
          required: true,
          content: {
            "multipart/form-data": {
              schema: {
                type: "object",
                properties: {
                  file: { type: "string", format: "binary", description: "Fichier image (max 4MB)" },
                },
              },
            },
            "application/json": {
              schema: {
                oneOf: [
                  {
                    type: "object",
                    properties: {
                      url: { type: "string", format: "uri", description: "URL d'une image à télécharger" },
                    },
                    required: ["url"],
                  },
                  {
                    type: "object",
                    properties: {
                      base64: { type: "string", description: "Image encodée en base64 (data:image/...)" },
                    },
                    required: ["base64"],
                  },
                ],
              },
            },
          },
        },
        responses: {
          "201": {
            description: "Image uploadée",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/UploadResponse" },
                example: {
                  data: {
                    url: "https://xyz.public.blob.vercel-storage.com/events/user-id/1234567890.jpg",
                    pathname: "events/user-id/1234567890.jpg",
                  },
                },
              },
            },
          },
          "400": { description: "Fichier invalide ou trop volumineux" },
          "401": { description: "Non authentifié" },
        },
      },
    },
  },
  tags: [
    { name: "Events", description: "Gestion des événements" },
    { name: "Upload", description: "Upload de fichiers" },
  ],
};

/**
 * GET /api/v1/openapi
 * Retourne la spécification OpenAPI au format JSON
 */
export async function GET(request: NextRequest) {
  // Remplacer le baseUrl par l'URL réelle
  const host = request.headers.get("host") || "localhost:3000";
  const protocol = host.includes("localhost") ? "http" : "https";
  const baseUrl = `${protocol}://${host}`;

  const spec = {
    ...openApiSpec,
    servers: [{ url: baseUrl }],
  };

  return Response.json(spec, {
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
