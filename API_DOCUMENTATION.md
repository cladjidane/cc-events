# EventLite API - Documentation Complète

> Documentation destinée à l'intégration via outils LLM/IA

## Informations de base

- **Base URL**: `https://cc-events-xxx.vercel.app` (remplacer par l'URL réelle)
- **Version API**: v1
- **Format**: JSON
- **Encoding**: UTF-8

---

## Authentification

### Générer une API Key

L'API utilise une authentification Bearer Token. L'API Key est générée à partir des credentials utilisateur.

**Formule**:
```
API_KEY = base64(email:NEXTAUTH_SECRET)
```

**Exemple en JavaScript**:
```javascript
const email = "admin@eventlite.fr";
const secret = "wUETxIK8LygcMJhc6uXNJfrzUbHmTqdUTQ4SBTGqUwY="; // NEXTAUTH_SECRET

// En Node.js
const apiKey = Buffer.from(`${email}:${secret}`).toString('base64');

// En navigateur
const apiKey = btoa(`${email}:${secret}`);
```

**Exemple en Python**:
```python
import base64

email = "admin@eventlite.fr"
secret = "wUETxIK8LygcMJhc6uXNJfrzUbHmTqdUTQ4SBTGqUwY="

api_key = base64.b64encode(f"{email}:{secret}".encode()).decode()
```

**Exemple en cURL**:
```bash
API_KEY=$(echo -n "admin@eventlite.fr:wUETxIK8LygcMJhc6uXNJfrzUbHmTqdUTQ4SBTGqUwY=" | base64)
```

### Utiliser l'API Key

Inclure dans chaque requête le header:
```
Authorization: Bearer <API_KEY>
```

**Exemple cURL**:
```bash
curl -X GET "https://your-app.vercel.app/api/v1/events" \
  -H "Authorization: Bearer YWRtaW5AZXZlbnRsaXRlLmZyOndVRVR4SUs4THlnY01KaGM2dVhOSmZyelViSG1UcWRVVFE0U0JUR3FVd1k9"
```

### Erreurs d'authentification

| Code | Message | Cause |
|------|---------|-------|
| 401 | "Unauthorized - Invalid or missing API key" | API Key absente, mal formée, ou secret incorrect |
| 403 | "Forbidden - You don't own this event" | Tentative de modifier un événement d'un autre utilisateur |

---

## Endpoints

### Récupérer la documentation OpenAPI

```
GET /api/v1/openapi
```

Retourne la spécification OpenAPI 3.1 complète au format JSON. Utile pour l'auto-discovery par les LLMs.

**Pas d'authentification requise.**

---

### Lister les événements

```
GET /api/v1/events
```

**Query Parameters**:
| Param | Type | Default | Description |
|-------|------|---------|-------------|
| status | string | - | Filtrer: `DRAFT`, `PUBLISHED`, `CLOSED`, `CANCELLED` |
| limit | integer | 50 | Max résultats (max: 100) |
| offset | integer | 0 | Pour pagination |

**Réponse**:
```json
{
  "data": [
    {
      "id": "uuid",
      "slug": "meetup-ia-paris",
      "title": "Meetup IA Paris",
      "subtitle": "Découvrez l'IA générative",
      "description": "...",
      "coverImage": "https://...",
      "mode": "IN_PERSON",
      "location": "42 rue Tech, Paris",
      "latitude": 48.8566,
      "longitude": 2.3522,
      "startAt": "2025-02-15T19:00:00.000Z",
      "endAt": "2025-02-15T21:00:00.000Z",
      "timezone": "Europe/Paris",
      "capacity": 50,
      "waitlist": true,
      "status": "PUBLISHED",
      "organizerId": "uuid",
      "createdAt": "2025-01-20T10:00:00.000Z",
      "updatedAt": "2025-01-20T10:00:00.000Z",
      "registrations_count": 12
    }
  ],
  "pagination": {
    "total": 15,
    "limit": 50,
    "offset": 0,
    "has_more": false
  }
}
```

---

### Créer un événement

```
POST /api/v1/events
```

**Headers**:
```
Content-Type: application/json
Authorization: Bearer <API_KEY>
```

**Body** (JSON):
```json
{
  "title": "Meetup IA Paris",
  "subtitle": "Découvrez l'IA générative",
  "description": "Rejoignez-nous pour une soirée dédiée à l'IA...",
  "coverImage": "https://blob.vercel-storage.com/...",
  "mode": "IN_PERSON",
  "location": "42 rue de la Tech, 75001 Paris",
  "latitude": 48.8566,
  "longitude": 2.3522,
  "startAt": "2025-02-15T19:00:00.000Z",
  "capacity": 50,
  "waitlist": true,
  "status": "DRAFT"
}
```

**Champs obligatoires**:
- `title` (string, 3-100 caractères)
- `mode` (string: `IN_PERSON` ou `ONLINE`)
- `startAt` (string, ISO 8601)

**Champs optionnels**:
| Champ | Type | Default | Description |
|-------|------|---------|-------------|
| subtitle | string | null | Sous-titre (max 200 car.) |
| description | string | null | Description longue (max 5000 car.) |
| coverImage | string | null | URL de l'image (utiliser /upload d'abord) |
| location | string | null | Adresse physique ou lien visio |
| latitude | number | null | Latitude GPS (-90 à 90) |
| longitude | number | null | Longitude GPS (-180 à 180) |
| endAt | string | startAt + 2h | Date de fin (auto-calculée si omis) |
| timezone | string | "Europe/Paris" | Fuseau horaire |
| capacity | integer | null | Capacité max (null = illimité) |
| waitlist | boolean | true | Activer liste d'attente |
| status | string | "DRAFT" | `DRAFT` ou `PUBLISHED` |

**Réponse** (201 Created):
```json
{
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "slug": "meetup-ia-paris",
    "title": "Meetup IA Paris",
    ...
  }
}
```

**Erreurs**:
| Code | Cause |
|------|-------|
| 400 | Données invalides (voir message d'erreur) |
| 401 | Non authentifié |

---

### Récupérer un événement

```
GET /api/v1/events/{id}
```

**Paramètre path**: `id` peut être l'UUID ou le slug de l'événement.

**Réponse**:
```json
{
  "data": {
    "id": "uuid",
    "slug": "meetup-ia-paris",
    "title": "Meetup IA Paris",
    ...
    "organizer": {
      "id": "uuid",
      "name": "Jean Dupont",
      "email": "jean@example.com"
    },
    "confirmed_count": 25,
    "waitlist_count": 5,
    "total_registrations": 30
  }
}
```

---

### Modifier un événement

```
PATCH /api/v1/events/{id}
```

Modification partielle. Seuls les champs envoyés sont modifiés.

**Body** (JSON) - tous les champs sont optionnels:
```json
{
  "title": "Nouveau titre",
  "status": "PUBLISHED"
}
```

**Cas d'usage courants**:

1. **Publier un événement**:
```json
{ "status": "PUBLISHED" }
```

2. **Modifier la capacité**:
```json
{ "capacity": 100 }
```

3. **Annuler un événement**:
```json
{ "status": "CANCELLED" }
```

4. **Ajouter une image**:
```json
{ "coverImage": "https://..." }
```

---

### Supprimer un événement

```
DELETE /api/v1/events/{id}
```

**Réponse** (200):
```json
{
  "message": "Event deleted successfully"
}
```

⚠️ Supprime également toutes les inscriptions associées.

---

### Uploader une image

```
POST /api/v1/upload
```

Trois méthodes supportées:

#### 1. Upload fichier direct (multipart/form-data)

```bash
curl -X POST "https://your-app.vercel.app/api/v1/upload" \
  -H "Authorization: Bearer <API_KEY>" \
  -F "file=@./mon-image.jpg"
```

#### 2. Depuis une URL externe

```bash
curl -X POST "https://your-app.vercel.app/api/v1/upload" \
  -H "Authorization: Bearer <API_KEY>" \
  -H "Content-Type: application/json" \
  -d '{"url": "https://example.com/image.jpg"}'
```

#### 3. Image en base64

```bash
curl -X POST "https://your-app.vercel.app/api/v1/upload" \
  -H "Authorization: Bearer <API_KEY>" \
  -H "Content-Type: application/json" \
  -d '{"base64": "data:image/png;base64,iVBORw0KGgo..."}'
```

**Contraintes**:
- Formats acceptés: JPEG, PNG, GIF, WebP
- Taille max: 4 MB

**Réponse** (201):
```json
{
  "data": {
    "url": "https://xyz.public.blob.vercel-storage.com/events/user-id/1234567890.jpg",
    "pathname": "events/user-id/1234567890.jpg"
  }
}
```

L'URL retournée peut être utilisée dans le champ `coverImage` d'un événement.

---

## Workflow complet : Créer un événement avec image

```javascript
const API_BASE = "https://your-app.vercel.app";
const API_KEY = "YWRtaW5AZXZlbnRsaXRlLmZyOi4uLg==";

async function createEventWithImage(eventData, imageBase64) {
  // 1. Upload l'image (si fournie)
  let coverImage = null;
  if (imageBase64) {
    const uploadRes = await fetch(`${API_BASE}/api/v1/upload`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ base64: imageBase64 })
    });

    if (!uploadRes.ok) {
      throw new Error("Upload failed");
    }

    const uploadData = await uploadRes.json();
    coverImage = uploadData.data.url;
  }

  // 2. Créer l'événement
  const eventRes = await fetch(`${API_BASE}/api/v1/events`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${API_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      ...eventData,
      coverImage,
      status: "PUBLISHED" // Publier directement
    })
  });

  if (!eventRes.ok) {
    const error = await eventRes.json();
    throw new Error(error.error);
  }

  return await eventRes.json();
}

// Utilisation
const result = await createEventWithImage({
  title: "Conférence IA 2025",
  subtitle: "L'avenir de l'intelligence artificielle",
  description: "Une journée complète dédiée aux dernières avancées en IA...",
  mode: "IN_PERSON",
  location: "Palais des Congrès, Paris",
  latitude: 48.8789,
  longitude: 2.2833,
  startAt: "2025-03-20T09:00:00.000Z",
  capacity: 500,
  waitlist: true
}, "data:image/png;base64,iVBORw0KGgo...");

console.log("Événement créé:", result.data.slug);
// URL publique: https://your-app.vercel.app/e/conference-ia-2025
```

---

## Valeurs des énumérations

### mode
| Valeur | Description |
|--------|-------------|
| `IN_PERSON` | Événement en présentiel (physique) |
| `ONLINE` | Événement en ligne (visioconférence) |

### status
| Valeur | Description |
|--------|-------------|
| `DRAFT` | Brouillon, non visible publiquement |
| `PUBLISHED` | Publié, visible sur la page d'accueil |
| `CLOSED` | Inscriptions fermées |
| `CANCELLED` | Événement annulé |

---

## Formats de données

### Dates
Format ISO 8601 avec timezone UTC recommandé:
```
2025-02-15T19:00:00.000Z
```

### Coordonnées GPS
- `latitude`: nombre décimal entre -90 et 90
- `longitude`: nombre décimal entre -180 et 180

Exemple pour Paris:
```json
{
  "latitude": 48.8566,
  "longitude": 2.3522
}
```

---

## Gestion des erreurs

Toutes les erreurs retournent un objet JSON:
```json
{
  "error": "Message d'erreur descriptif"
}
```

### Codes HTTP
| Code | Signification |
|------|---------------|
| 200 | Succès |
| 201 | Ressource créée |
| 400 | Données invalides |
| 401 | Non authentifié |
| 403 | Accès refusé |
| 404 | Ressource non trouvée |
| 500 | Erreur serveur |

---

## Limites et quotas

- **Rate limiting**: Aucune limite stricte actuellement
- **Taille max upload**: 4 MB par image
- **Pagination**: 100 résultats max par requête

---

## URLs publiques

Chaque événement publié est accessible à:
```
https://your-app.vercel.app/e/{slug}
```

Le `slug` est généré automatiquement à partir du titre lors de la création.

---

## Informations de connexion (développement)

| Paramètre | Valeur |
|-----------|--------|
| Email admin | `admin@eventlite.fr` |
| NEXTAUTH_SECRET | Voir variables d'environnement Vercel |
| Base URL | L'URL de votre déploiement Vercel |

---

## Exemple de prompt pour LLM

Voici un exemple de prompt que vous pouvez utiliser avec un LLM pour créer des événements:

```
Tu es un assistant qui crée des événements via l'API EventLite.

Base URL: https://cc-events.vercel.app
API Key: [VOTRE_API_KEY]

Pour créer un événement:
1. Si une image est nécessaire, la générer puis l'uploader via POST /api/v1/upload
2. Créer l'événement via POST /api/v1/events

Champs obligatoires: title, mode (IN_PERSON ou ONLINE), startAt (ISO 8601)
Champs recommandés: description, location, capacity, status (PUBLISHED pour rendre visible)

L'utilisateur demande: [REQUÊTE]
```

---

## Inscriptions (Registrations)

### Lister les inscriptions d'un événement

```
GET /api/v1/events/{id}/registrations
```

**Query Parameters**:
| Param | Type | Default | Description |
|-------|------|---------|-------------|
| status | string | - | Filtrer: `CONFIRMED`, `WAITLIST`, `CANCELLED` |
| limit | integer | 50 | Max résultats (max: 100) |
| offset | integer | 0 | Pour pagination |

**Réponse**:
```json
{
  "data": [
    {
      "id": "uuid",
      "email": "participant@example.com",
      "name": "Jean Dupont",
      "first_name": "Jean",
      "last_name": "Dupont",
      "notes": "Végétarien",
      "status": "CONFIRMED",
      "registered_at": "2025-01-20T10:00:00.000Z",
      "updated_at": "2025-01-20T10:00:00.000Z"
    }
  ],
  "pagination": { "total": 25, "limit": 50, "offset": 0, "has_more": false }
}
```

---

### Inscrire un participant

```
POST /api/v1/events/{id}/registrations
```

**Body**:
```json
{
  "email": "participant@example.com",
  "name": "Jean Dupont",
  "notes": "Végétarien"
}
```

**Comportement**:
- Si capacité disponible → `CONFIRMED`
- Si complet + waitlist → `WAITLIST`
- Si complet sans waitlist → erreur 400

**Réponse** (201):
```json
{
  "data": {
    "id": "uuid",
    "email": "participant@example.com",
    "name": "Jean Dupont",
    "status": "CONFIRMED",
    "event": {
      "id": "uuid",
      "title": "Meetup IA Paris",
      "slug": "meetup-ia-paris"
    }
  }
}
```

---

### Récupérer une inscription

```
GET /api/v1/events/{id}/registrations/{email}
```

Le paramètre `email` doit être URL-encoded (ex: `user%40example.com`).

---

### Modifier une inscription

```
PATCH /api/v1/events/{id}/registrations/{email}
```

**Body** (tous optionnels):
```json
{
  "name": "Nouveau Nom",
  "notes": "Nouvelles notes",
  "status": "CONFIRMED"
}
```

⚠️ Changer le status de `CONFIRMED` à autre chose promouvra le premier de la waitlist.

---

### Annuler une inscription

```
DELETE /api/v1/events/{id}/registrations/{email}
```

**Réponse**:
```json
{
  "data": {
    "message": "Registration cancelled successfully",
    "promoted": {
      "email": "next@example.com",
      "name": "Marie Martin"
    }
  }
}
```

Le champ `promoted` est présent si quelqu'un a été promu depuis la waitlist.

---

## Notifications

### Envoyer une notification aux participants

```
POST /api/v1/events/{id}/notify
```

**Query Parameters**:
| Param | Type | Default | Description |
|-------|------|---------|-------------|
| preview | boolean | false | Mode aperçu (ne pas envoyer) |

**Body**:
```json
{
  "subject": "Rappel : Meetup IA demain !",
  "message": "N'oubliez pas notre événement demain à 19h.\n\nÀ très vite !",
  "target": "confirmed",
  "includeEventDetails": true
}
```

| Champ | Type | Default | Description |
|-------|------|---------|-------------|
| subject | string | *requis* | Objet de l'email |
| message | string | *requis* | Corps du message (\\n pour sauts de ligne) |
| target | string | "all" | `all`, `confirmed`, ou `waitlist` |
| includeEventDetails | boolean | true | Inclure les infos de l'événement |

**Réponse**:
```json
{
  "data": {
    "sent": 23,
    "failed": 1,
    "target": "confirmed",
    "total": 24,
    "details": [
      { "email": "user@example.com", "status": "sent" },
      { "email": "bad@email", "status": "failed", "error": "Invalid email" }
    ]
  }
}
```

---

## Webhooks

### Lister les webhooks

```
GET /api/v1/webhooks
```

**Réponse**:
```json
{
  "data": [
    {
      "id": "uuid",
      "url": "https://mon-serveur.com/webhook",
      "events": ["registration.created", "registration.cancelled"],
      "active": true,
      "created_at": "2025-01-20T10:00:00.000Z"
    }
  ],
  "available_events": [
    "registration.created",
    "registration.cancelled",
    "registration.promoted",
    "event.created",
    "event.updated",
    "event.published",
    "event.cancelled"
  ]
}
```

---

### Créer un webhook

```
POST /api/v1/webhooks
```

**Body**:
```json
{
  "url": "https://mon-serveur.com/webhook",
  "events": ["registration.created", "registration.cancelled"],
  "secret": "mon-secret-optionnel"
}
```

**Important**: Le secret est retourné uniquement à la création. Conservez-le !

**Réponse** (201):
```json
{
  "data": {
    "id": "uuid",
    "url": "https://mon-serveur.com/webhook",
    "events": ["registration.created", "registration.cancelled"],
    "active": true,
    "secret": "abc123...",
    "created_at": "2025-01-20T10:00:00.000Z"
  },
  "message": "Webhook created. Save the secret - it won't be shown again."
}
```

---

### Payload webhook

Les payloads sont signés avec HMAC-SHA256. Le header `X-EventLite-Signature` contient `sha256=<signature>`.

**Exemple de payload**:
```json
{
  "id": "delivery-uuid",
  "event": "registration.created",
  "timestamp": "2025-01-20T10:00:00.000Z",
  "data": {
    "registration": {
      "id": "uuid",
      "email": "user@example.com",
      "name": "Jean Dupont",
      "status": "CONFIRMED"
    },
    "event": {
      "id": "uuid",
      "title": "Meetup IA Paris",
      "slug": "meetup-ia-paris"
    }
  }
}
```

**Vérification de signature (Node.js)**:
```javascript
const crypto = require('crypto');

function verifyWebhook(payload, signature, secret) {
  const expected = 'sha256=' + crypto
    .createHmac('sha256', secret)
    .update(JSON.stringify(payload))
    .digest('hex');
  return signature === expected;
}
```

---

### Tester un webhook

```
POST /api/v1/webhooks/{id}/test
```

Envoie un payload de test au webhook.

**Réponse**:
```json
{
  "data": {
    "success": true,
    "url": "https://mon-serveur.com/webhook",
    "status_code": 200,
    "duration_ms": 234
  }
}
```

---

## Statistiques

### Statistiques globales

```
GET /api/v1/stats
```

**Réponse**:
```json
{
  "data": {
    "events": {
      "total": 15,
      "by_status": {
        "draft": 5,
        "published": 8,
        "closed": 1,
        "cancelled": 1
      }
    },
    "registrations": {
      "total": 234,
      "by_status": {
        "confirmed": 189,
        "waitlist": 45
      }
    },
    "upcoming": [
      {
        "id": "uuid",
        "title": "Meetup IA Paris",
        "slug": "meetup-ia-paris",
        "start_at": "2025-02-15T19:00:00.000Z",
        "confirmed": 25,
        "capacity": 30
      }
    ],
    "recent_activity": [
      {
        "type": "registration",
        "action": "created",
        "email": "user@example.com",
        "name": "Jean Dupont",
        "event_title": "Meetup IA Paris",
        "at": "2025-01-20T10:00:00.000Z"
      }
    ]
  }
}
```

---

### Statistiques d'un événement

```
GET /api/v1/stats/events/{id}
```

**Réponse**:
```json
{
  "data": {
    "event": {
      "id": "uuid",
      "title": "Meetup IA Paris",
      "slug": "meetup-ia-paris",
      "status": "PUBLISHED",
      "start_at": "2025-02-15T19:00:00.000Z"
    },
    "registrations": {
      "confirmed": 25,
      "waitlist": 5,
      "cancelled": 3,
      "total": 30,
      "capacity": 30,
      "fill_rate": 83.3,
      "spots_left": 5
    },
    "timeline": [
      { "date": "2025-01-15", "cumulative": 5 },
      { "date": "2025-01-16", "cumulative": 12 },
      { "date": "2025-01-17", "cumulative": 25 }
    ]
  }
}
```

---

## MCP Server (Claude)

EventLite dispose d'un serveur MCP pour une intégration native avec Claude Desktop.

### Installation

Ajoutez à votre `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "eventlite": {
      "command": "npx",
      "args": ["@eventlite/mcp-server"],
      "env": {
        "EVENTLITE_API_URL": "https://your-app.vercel.app",
        "EVENTLITE_API_KEY": "votre-api-key"
      }
    }
  }
}
```

### Tools disponibles

| Tool | Description |
|------|-------------|
| `list_events` | Lister les événements |
| `get_event` | Détails d'un événement |
| `create_event` | Créer un événement |
| `update_event` | Modifier un événement |
| `delete_event` | Supprimer un événement |
| `list_registrations` | Lister les inscrits |
| `register_attendee` | Inscrire quelqu'un |
| `unregister_attendee` | Désinscrire quelqu'un |
| `send_notification` | Envoyer un email |

### Exemple d'utilisation

```
User: "Montre-moi mes événements"
Claude: Tu as 2 événements à venir:
        - Meetup IA Paris (mardi 19h) - 23/30 places
        - Workshop React (jeudi 14h) - 15 inscrits

User: "Inscris alice@example.com au Meetup IA"
Claude: ✅ Alice a été inscrite avec le statut CONFIRMED

User: "Envoie un rappel aux inscrits du Meetup"
Claude: ✅ Email de rappel envoyé à 23 personnes
```
