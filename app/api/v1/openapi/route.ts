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
Authorization: Bearer evl_xxxxxxxxxxxxx
\`\`\`

**Générer une API Key:**
1. Connectez-vous à votre compte EventLite
2. Allez dans **Paramètres → Clés API**
3. Créez une nouvelle clé
4. Copiez le token (affiché une seule fois)

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
        description: "API Key générée depuis Paramètres → Clés API (format: evl_xxx)",
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
      Registration: {
        type: "object",
        properties: {
          id: { type: "string", format: "uuid", description: "Identifiant unique" },
          email: { type: "string", format: "email", description: "Email du participant" },
          name: { type: "string", description: "Nom complet (prénom + nom)" },
          first_name: { type: "string", description: "Prénom" },
          last_name: { type: "string", description: "Nom de famille" },
          notes: { type: "string", nullable: true, description: "Notes optionnelles" },
          status: {
            type: "string",
            enum: ["CONFIRMED", "WAITLIST", "CANCELLED"],
            description: "CONFIRMED = inscrit, WAITLIST = en attente, CANCELLED = annulé",
          },
          registered_at: { type: "string", format: "date-time", description: "Date d'inscription" },
          updated_at: { type: "string", format: "date-time", description: "Dernière mise à jour" },
          event: {
            type: "object",
            properties: {
              id: { type: "string", format: "uuid" },
              title: { type: "string" },
              slug: { type: "string" },
            },
          },
        },
        required: ["id", "email", "name", "status", "registered_at"],
      },
      RegistrationCreate: {
        type: "object",
        properties: {
          email: { type: "string", format: "email", description: "Email du participant" },
          name: { type: "string", description: "Nom complet (sera séparé en prénom/nom)", minLength: 1, maxLength: 100 },
          notes: { type: "string", description: "Notes optionnelles", maxLength: 500 },
        },
        required: ["email", "name"],
        example: {
          email: "participant@example.com",
          name: "Jean Dupont",
          notes: "Végétarien",
        },
      },
      RegistrationUpdate: {
        type: "object",
        description: "Tous les champs sont optionnels. Seuls les champs fournis seront mis à jour.",
        properties: {
          name: { type: "string", description: "Nom complet", minLength: 1, maxLength: 100 },
          notes: { type: "string", nullable: true, description: "Notes optionnelles", maxLength: 500 },
          status: {
            type: "string",
            enum: ["CONFIRMED", "WAITLIST", "CANCELLED"],
            description: "Nouveau statut",
          },
        },
        example: {
          status: "CONFIRMED",
        },
      },
      NotificationRequest: {
        type: "object",
        properties: {
          subject: { type: "string", description: "Objet de l'email", minLength: 1, maxLength: 200 },
          message: { type: "string", description: "Contenu du message (supporte les sauts de ligne)", minLength: 1, maxLength: 5000 },
          target: {
            type: "string",
            enum: ["all", "confirmed", "waitlist"],
            default: "all",
            description: "Destinataires ciblés",
          },
          includeEventDetails: {
            type: "boolean",
            default: true,
            description: "Inclure les détails de l'événement dans l'email",
          },
        },
        required: ["subject", "message"],
        example: {
          subject: "Rappel : Meetup IA demain !",
          message: "N'oubliez pas notre événement demain à 19h.\n\nNous avons préparé une soirée exceptionnelle !\n\nÀ très vite !",
          target: "confirmed",
          includeEventDetails: true,
        },
      },
      Webhook: {
        type: "object",
        properties: {
          id: { type: "string", format: "uuid" },
          url: { type: "string", format: "uri", description: "URL de destination" },
          events: {
            type: "array",
            items: { type: "string" },
            description: "Événements écoutés",
          },
          active: { type: "boolean", description: "Webhook actif ou non" },
          created_at: { type: "string", format: "date-time" },
          updated_at: { type: "string", format: "date-time" },
        },
      },
      WebhookCreate: {
        type: "object",
        properties: {
          url: { type: "string", format: "uri", description: "URL de destination (doit être HTTPS en production)" },
          events: {
            type: "array",
            items: {
              type: "string",
              enum: [
                "registration.created",
                "registration.cancelled",
                "registration.promoted",
                "event.created",
                "event.updated",
                "event.published",
                "event.cancelled",
              ],
            },
            minItems: 1,
            description: "Événements à écouter",
          },
          secret: { type: "string", minLength: 16, description: "Secret pour signer les payloads (optionnel, généré si omis)" },
        },
        required: ["url", "events"],
        example: {
          url: "https://mon-serveur.com/webhook",
          events: ["registration.created", "registration.cancelled"],
        },
      },
      WebhookUpdate: {
        type: "object",
        properties: {
          url: { type: "string", format: "uri" },
          events: { type: "array", items: { type: "string" } },
          active: { type: "boolean" },
          secret: { type: "string", minLength: 16 },
        },
        example: {
          active: false,
        },
      },
      WebhookPayload: {
        type: "object",
        description: "Format du payload envoyé aux webhooks",
        properties: {
          id: { type: "string", format: "uuid", description: "ID unique de la livraison" },
          event: { type: "string", description: "Type d'événement" },
          timestamp: { type: "string", format: "date-time" },
          data: { type: "object", description: "Données de l'événement" },
        },
        example: {
          id: "550e8400-e29b-41d4-a716-446655440000",
          event: "registration.created",
          timestamp: "2025-01-20T10:00:00.000Z",
          data: {
            registration: {
              id: "uuid",
              email: "user@example.com",
              name: "Jean Dupont",
              status: "CONFIRMED",
            },
            event: {
              id: "uuid",
              title: "Meetup IA Paris",
              slug: "meetup-ia-paris",
            },
          },
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
    "/api/v1/events/{id}/registrations": {
      get: {
        summary: "Lister les inscriptions",
        description: "Retourne toutes les inscriptions d'un événement. Par défaut, exclut les inscriptions annulées.",
        tags: ["Registrations"],
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "string" },
            description: "ID (UUID) ou slug de l'événement",
          },
          {
            name: "status",
            in: "query",
            schema: { type: "string", enum: ["CONFIRMED", "WAITLIST", "CANCELLED"] },
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
            description: "Liste des inscriptions",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    data: { type: "array", items: { $ref: "#/components/schemas/Registration" } },
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
          "404": { description: "Événement non trouvé" },
        },
      },
      post: {
        summary: "Inscrire un participant",
        description: `
Inscrit un participant à un événement.

**Comportement automatique:**
- Si l'événement a de la capacité disponible → statut CONFIRMED
- Si complet et waitlist activée → statut WAITLIST
- Si complet sans waitlist → erreur 400
- Si l'email est déjà inscrit avec statut CANCELLED → réactivation de l'inscription
        `.trim(),
        tags: ["Registrations"],
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "string" },
            description: "ID (UUID) ou slug de l'événement",
          },
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/RegistrationCreate" },
            },
          },
        },
        responses: {
          "201": {
            description: "Inscription créée",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    data: { $ref: "#/components/schemas/Registration" },
                  },
                },
              },
            },
          },
          "400": { description: "Données invalides ou événement complet" },
          "401": { description: "Non authentifié" },
          "404": { description: "Événement non trouvé" },
        },
      },
    },
    "/api/v1/events/{id}/registrations/{email}": {
      get: {
        summary: "Récupérer une inscription",
        description: "Récupère les détails d'une inscription par email.",
        tags: ["Registrations"],
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "string" },
            description: "ID (UUID) ou slug de l'événement",
          },
          {
            name: "email",
            in: "path",
            required: true,
            schema: { type: "string", format: "email" },
            description: "Email du participant (URL-encoded)",
          },
        ],
        responses: {
          "200": {
            description: "Détails de l'inscription",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    data: { $ref: "#/components/schemas/Registration" },
                  },
                },
              },
            },
          },
          "404": { description: "Événement ou inscription non trouvé" },
        },
      },
      patch: {
        summary: "Modifier une inscription",
        description: `
Met à jour une inscription existante.

**Gestion automatique de la waitlist:**
- Si on passe de CONFIRMED à CANCELLED → le premier en WAITLIST est promu
- Si on passe à CONFIRMED → vérifie qu'il reste de la capacité
        `.trim(),
        tags: ["Registrations"],
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "string" },
            description: "ID (UUID) ou slug de l'événement",
          },
          {
            name: "email",
            in: "path",
            required: true,
            schema: { type: "string", format: "email" },
            description: "Email du participant (URL-encoded)",
          },
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/RegistrationUpdate" },
            },
          },
        },
        responses: {
          "200": {
            description: "Inscription mise à jour",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    data: { $ref: "#/components/schemas/Registration" },
                  },
                },
              },
            },
          },
          "400": { description: "Données invalides ou capacité dépassée" },
          "404": { description: "Événement ou inscription non trouvé" },
        },
      },
      delete: {
        summary: "Annuler une inscription",
        description: `
Annule une inscription (passe le statut à CANCELLED).

**Gestion automatique de la waitlist:**
Si l'inscription annulée était CONFIRMED, le premier en WAITLIST est automatiquement promu à CONFIRMED.
La réponse inclut les informations du participant promu le cas échéant.
        `.trim(),
        tags: ["Registrations"],
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "string" },
            description: "ID (UUID) ou slug de l'événement",
          },
          {
            name: "email",
            in: "path",
            required: true,
            schema: { type: "string", format: "email" },
            description: "Email du participant (URL-encoded)",
          },
        ],
        responses: {
          "200": {
            description: "Inscription annulée",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    data: {
                      type: "object",
                      properties: {
                        message: { type: "string" },
                        promoted: {
                          type: "object",
                          nullable: true,
                          description: "Participant promu depuis la waitlist (si applicable)",
                          properties: {
                            email: { type: "string" },
                            name: { type: "string" },
                          },
                        },
                      },
                    },
                  },
                },
                example: {
                  data: {
                    message: "Registration cancelled successfully",
                    promoted: {
                      email: "next@example.com",
                      name: "Marie Martin",
                    },
                  },
                },
              },
            },
          },
          "400": { description: "Inscription déjà annulée" },
          "404": { description: "Événement ou inscription non trouvé" },
        },
      },
    },
    "/api/v1/events/{id}/notify": {
      post: {
        summary: "Envoyer une notification",
        description: `
Envoie un email personnalisé aux participants d'un événement.

**Modes d'envoi:**
- Ajoutez \`?preview=true\` pour voir un aperçu sans envoyer
- Sans le paramètre, les emails sont envoyés immédiatement

**Cibles disponibles:**
- \`all\` : Tous les inscrits (confirmés + waitlist)
- \`confirmed\` : Uniquement les confirmés
- \`waitlist\` : Uniquement la liste d'attente
        `.trim(),
        tags: ["Notifications"],
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "string" },
            description: "ID (UUID) ou slug de l'événement",
          },
          {
            name: "preview",
            in: "query",
            schema: { type: "boolean", default: false },
            description: "Mode aperçu (ne pas envoyer)",
          },
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/NotificationRequest" },
            },
          },
        },
        responses: {
          "200": {
            description: "Notifications envoyées",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    data: {
                      type: "object",
                      properties: {
                        sent: { type: "integer", description: "Nombre d'emails envoyés" },
                        failed: { type: "integer", description: "Nombre d'échecs" },
                        target: { type: "string" },
                        total: { type: "integer" },
                        details: {
                          type: "array",
                          items: {
                            type: "object",
                            properties: {
                              email: { type: "string" },
                              status: { type: "string", enum: ["sent", "failed"] },
                              error: { type: "string" },
                            },
                          },
                        },
                      },
                    },
                  },
                },
                example: {
                  data: {
                    sent: 23,
                    failed: 1,
                    target: "confirmed",
                    total: 24,
                    details: [
                      { email: "user@example.com", status: "sent" },
                      { email: "bad@email", status: "failed", error: "Invalid email" },
                    ],
                  },
                },
              },
            },
          },
          "400": { description: "Données invalides ou aucun destinataire" },
          "401": { description: "Non authentifié" },
          "404": { description: "Événement non trouvé" },
        },
      },
    },
    "/api/v1/webhooks": {
      get: {
        summary: "Lister les webhooks",
        description: "Retourne tous les webhooks de l'utilisateur authentifié avec la liste des événements disponibles.",
        tags: ["Webhooks"],
        responses: {
          "200": {
            description: "Liste des webhooks",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    data: { type: "array", items: { $ref: "#/components/schemas/Webhook" } },
                    available_events: {
                      type: "array",
                      items: { type: "string" },
                      description: "Liste des événements disponibles",
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
        summary: "Créer un webhook",
        description: `
Crée un nouveau webhook. Le secret est retourné uniquement à la création - conservez-le précieusement.

**Signature des payloads:**
Les payloads sont signés avec HMAC-SHA256. Le header \`X-EventLite-Signature\` contient la signature au format \`sha256=<signature>\`.

**Vérification en JavaScript:**
\`\`\`javascript
const crypto = require('crypto');
const signature = crypto
  .createHmac('sha256', webhookSecret)
  .update(JSON.stringify(payload))
  .digest('hex');
const isValid = \`sha256=\${signature}\` === req.headers['x-eventlite-signature'];
\`\`\`
        `.trim(),
        tags: ["Webhooks"],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/WebhookCreate" },
            },
          },
        },
        responses: {
          "201": {
            description: "Webhook créé (inclut le secret)",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    data: {
                      allOf: [
                        { $ref: "#/components/schemas/Webhook" },
                        {
                          type: "object",
                          properties: {
                            secret: { type: "string", description: "Secret pour vérifier les signatures (affiché uniquement à la création)" },
                          },
                        },
                      ],
                    },
                    message: { type: "string" },
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
    "/api/v1/webhooks/{id}": {
      get: {
        summary: "Récupérer un webhook",
        description: "Récupère les détails d'un webhook par son ID.",
        tags: ["Webhooks"],
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "string", format: "uuid" },
          },
        ],
        responses: {
          "200": {
            description: "Détails du webhook",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    data: { $ref: "#/components/schemas/Webhook" },
                  },
                },
              },
            },
          },
          "404": { description: "Webhook non trouvé" },
        },
      },
      patch: {
        summary: "Modifier un webhook",
        description: "Met à jour un webhook existant. Vous pouvez modifier l'URL, les événements, l'état actif et le secret.",
        tags: ["Webhooks"],
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "string", format: "uuid" },
          },
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/WebhookUpdate" },
            },
          },
        },
        responses: {
          "200": {
            description: "Webhook mis à jour",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    data: { $ref: "#/components/schemas/Webhook" },
                  },
                },
              },
            },
          },
          "400": { description: "Données invalides" },
          "404": { description: "Webhook non trouvé" },
        },
      },
      delete: {
        summary: "Supprimer un webhook",
        description: "Supprime définitivement un webhook.",
        tags: ["Webhooks"],
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "string", format: "uuid" },
          },
        ],
        responses: {
          "200": {
            description: "Webhook supprimé",
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
          "404": { description: "Webhook non trouvé" },
        },
      },
    },
    "/api/v1/webhooks/{id}/test": {
      post: {
        summary: "Tester un webhook",
        description: "Envoie un payload de test au webhook pour vérifier qu'il fonctionne correctement.",
        tags: ["Webhooks"],
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "string", format: "uuid" },
          },
        ],
        responses: {
          "200": {
            description: "Résultat du test",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    data: {
                      type: "object",
                      properties: {
                        success: { type: "boolean" },
                        url: { type: "string" },
                        status_code: { type: "integer" },
                        error: { type: "string" },
                        duration_ms: { type: "integer" },
                      },
                    },
                  },
                },
                example: {
                  data: {
                    success: true,
                    url: "https://mon-serveur.com/webhook",
                    status_code: 200,
                    duration_ms: 234,
                  },
                },
              },
            },
          },
          "404": { description: "Webhook non trouvé" },
        },
      },
    },
    "/api/v1/stats": {
      get: {
        summary: "Statistiques globales",
        description: "Retourne les statistiques globales : nombre d'événements, inscriptions, événements à venir et activité récente.",
        tags: ["Stats"],
        responses: {
          "200": {
            description: "Statistiques globales",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    data: {
                      type: "object",
                      properties: {
                        events: {
                          type: "object",
                          properties: {
                            total: { type: "integer" },
                            by_status: {
                              type: "object",
                              properties: {
                                draft: { type: "integer" },
                                published: { type: "integer" },
                                closed: { type: "integer" },
                                cancelled: { type: "integer" },
                              },
                            },
                          },
                        },
                        registrations: {
                          type: "object",
                          properties: {
                            total: { type: "integer" },
                            by_status: {
                              type: "object",
                              properties: {
                                confirmed: { type: "integer" },
                                waitlist: { type: "integer" },
                              },
                            },
                          },
                        },
                        upcoming: {
                          type: "array",
                          items: {
                            type: "object",
                            properties: {
                              id: { type: "string" },
                              title: { type: "string" },
                              slug: { type: "string" },
                              start_at: { type: "string", format: "date-time" },
                              confirmed: { type: "integer" },
                              capacity: { type: "integer", nullable: true },
                            },
                          },
                        },
                        recent_activity: {
                          type: "array",
                          items: {
                            type: "object",
                            properties: {
                              type: { type: "string" },
                              action: { type: "string" },
                              email: { type: "string" },
                              name: { type: "string" },
                              event_title: { type: "string" },
                              at: { type: "string", format: "date-time" },
                            },
                          },
                        },
                      },
                    },
                  },
                },
                example: {
                  data: {
                    events: {
                      total: 15,
                      by_status: { draft: 5, published: 8, closed: 1, cancelled: 1 },
                    },
                    registrations: {
                      total: 234,
                      by_status: { confirmed: 189, waitlist: 45 },
                    },
                    upcoming: [
                      {
                        id: "uuid",
                        title: "Meetup IA Paris",
                        slug: "meetup-ia-paris",
                        start_at: "2025-02-15T19:00:00.000Z",
                        confirmed: 25,
                        capacity: 30,
                      },
                    ],
                    recent_activity: [
                      {
                        type: "registration",
                        action: "created",
                        email: "user@example.com",
                        name: "Jean Dupont",
                        event_title: "Meetup IA Paris",
                        at: "2025-01-20T10:00:00.000Z",
                      },
                    ],
                  },
                },
              },
            },
          },
          "401": { description: "Non authentifié" },
        },
      },
    },
    "/api/v1/stats/events/{id}": {
      get: {
        summary: "Statistiques d'un événement",
        description: "Retourne les statistiques détaillées d'un événement : inscriptions, taux de remplissage et timeline.",
        tags: ["Stats"],
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
            description: "Statistiques de l'événement",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    data: {
                      type: "object",
                      properties: {
                        event: {
                          type: "object",
                          properties: {
                            id: { type: "string" },
                            title: { type: "string" },
                            slug: { type: "string" },
                            status: { type: "string" },
                            start_at: { type: "string", format: "date-time" },
                          },
                        },
                        registrations: {
                          type: "object",
                          properties: {
                            confirmed: { type: "integer" },
                            waitlist: { type: "integer" },
                            cancelled: { type: "integer" },
                            total: { type: "integer" },
                            capacity: { type: "integer", nullable: true },
                            fill_rate: { type: "number", nullable: true },
                            spots_left: { type: "integer", nullable: true },
                          },
                        },
                        timeline: {
                          type: "array",
                          description: "Inscriptions cumulées par jour",
                          items: {
                            type: "object",
                            properties: {
                              date: { type: "string", format: "date" },
                              cumulative: { type: "integer" },
                            },
                          },
                        },
                      },
                    },
                  },
                },
                example: {
                  data: {
                    event: {
                      id: "uuid",
                      title: "Meetup IA Paris",
                      slug: "meetup-ia-paris",
                      status: "PUBLISHED",
                      start_at: "2025-02-15T19:00:00.000Z",
                    },
                    registrations: {
                      confirmed: 25,
                      waitlist: 5,
                      cancelled: 3,
                      total: 30,
                      capacity: 30,
                      fill_rate: 83.3,
                      spots_left: 5,
                    },
                    timeline: [
                      { date: "2025-01-15", cumulative: 5 },
                      { date: "2025-01-16", cumulative: 12 },
                      { date: "2025-01-17", cumulative: 25 },
                    ],
                  },
                },
              },
            },
          },
          "401": { description: "Non authentifié" },
          "404": { description: "Événement non trouvé" },
        },
      },
    },
  },
  tags: [
    { name: "Events", description: "Gestion des événements" },
    { name: "Registrations", description: "Gestion des inscriptions" },
    { name: "Notifications", description: "Envoi d'emails aux participants" },
    { name: "Webhooks", description: "Intégrations temps réel via webhooks" },
    { name: "Stats", description: "Statistiques et analytics" },
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
