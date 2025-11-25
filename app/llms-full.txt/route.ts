import { NextRequest } from "next/server";

const llmsFullTxt = `# EventLite - Documentation complète pour LLM

> Plateforme de gestion d'événements avec API REST. Ce document contient toutes les informations nécessaires pour utiliser l'API via un LLM.

## Vue d'ensemble

EventLite permet de :
- Créer et gérer des événements (présentiel ou en ligne)
- Gérer les inscriptions avec capacité et liste d'attente automatique
- Envoyer des emails aux participants
- Recevoir des webhooks en temps réel
- Consulter des statistiques

---

## Authentification

Toutes les requêtes API nécessitent une authentification Bearer Token.

### Générer une API Key

L'API Key est générée en encodant en base64 : \`email:NEXTAUTH_SECRET\`

**JavaScript :**
\`\`\`javascript
const apiKey = btoa("admin@eventlite.fr:votre-nextauth-secret");
\`\`\`

**Bash :**
\`\`\`bash
API_KEY=$(echo -n "admin@eventlite.fr:votre-nextauth-secret" | base64)
\`\`\`

### Utilisation

Inclure dans chaque requête :
\`\`\`
Authorization: Bearer <API_KEY>
\`\`\`

---

## Formats de données

- **Dates** : ISO 8601 avec timezone, ex: \`2025-03-15T19:00:00+01:00\`
- **IDs** : UUID v4
- **Réponses** : JSON avec structure \`{ "data": ... }\` ou \`{ "error": "message" }\`

---

## Événements

### Créer un événement

\`POST /api/v1/events\`

**Champs :**

| Champ | Type | Requis | Description |
|-------|------|--------|-------------|
| title | string | ✅ | Titre (3-100 caractères) |
| subtitle | string | | Sous-titre (max 200 caractères) |
| description | string | | Description détaillée |
| mode | string | ✅ | \`IN_PERSON\` ou \`ONLINE\` |
| location | string | | Adresse physique ou lien visio |
| latitude | number | | Latitude GPS (pour présentiel) |
| longitude | number | | Longitude GPS (pour présentiel) |
| startAt | string | ✅ | Date/heure de début (ISO 8601) |
| endAt | string | | Date/heure de fin (défaut: startAt + 2h) |
| capacity | integer | | Capacité max (null = illimité) |
| waitlist | boolean | | Activer liste d'attente (défaut: true) |
| coverImage | string | | URL de l'image de couverture |
| status | string | | \`DRAFT\` ou \`PUBLISHED\` (défaut: DRAFT) |

**Exemple de transformation brief → API :**

Brief utilisateur :
> "Organise un meetup IA le 15 mars 2025 à 19h au WeWork Paris, max 50 personnes, sur les agents autonomes"

Requête API :
\`\`\`json
{
  "title": "Meetup IA - Agents Autonomes",
  "description": "Présentation et discussions sur les agents IA autonomes",
  "mode": "IN_PERSON",
  "location": "WeWork Paris",
  "startAt": "2025-03-15T19:00:00+01:00",
  "endAt": "2025-03-15T21:00:00+01:00",
  "capacity": 50,
  "status": "DRAFT"
}
\`\`\`

Réponse :
\`\`\`json
{
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "slug": "meetup-ia-agents-autonomes",
    "title": "Meetup IA - Agents Autonomes",
    "status": "DRAFT",
    ...
  }
}
\`\`\`

### Lister les événements

\`GET /api/v1/events\`

Paramètres query :
- \`status\` : Filtrer par DRAFT, PUBLISHED, CLOSED, CANCELLED
- \`limit\` : Nombre max (défaut: 50, max: 100)
- \`offset\` : Pagination

### Récupérer un événement

\`GET /api/v1/events/{id}\`

Le paramètre \`id\` peut être l'UUID ou le slug.

### Modifier un événement

\`PATCH /api/v1/events/{id}\`

Envoyer uniquement les champs à modifier.

**Publier un événement :**
\`\`\`json
{ "status": "PUBLISHED" }
\`\`\`

### Supprimer un événement

\`DELETE /api/v1/events/{id}\`

---

## Inscriptions

### Inscrire un participant

\`POST /api/v1/events/{id}/registrations\`

**Champs :**

| Champ | Type | Requis | Description |
|-------|------|--------|-------------|
| email | string | ✅ | Email du participant |
| name | string | ✅ | Nom complet |
| notes | string | | Notes optionnelles |

**Comportement automatique :**
- Capacité disponible → statut \`CONFIRMED\`
- Complet + waitlist activée → statut \`WAITLIST\`
- Complet sans waitlist → erreur 400

**Exemple :**

Brief :
> "Inscris jean.dupont@email.com au meetup IA"

Requête :
\`\`\`json
{
  "email": "jean.dupont@email.com",
  "name": "Jean Dupont"
}
\`\`\`

### Lister les inscriptions

\`GET /api/v1/events/{id}/registrations\`

Paramètres :
- \`status\` : CONFIRMED, WAITLIST, CANCELLED
- \`limit\`, \`offset\` : Pagination

### Annuler une inscription

\`DELETE /api/v1/events/{id}/registrations/{email}\`

Note : L'email doit être URL-encoded.

**Promotion automatique :** Si l'inscription annulée était CONFIRMED, le premier en WAITLIST est promu automatiquement.

---

## Notifications

### Envoyer un email aux participants

\`POST /api/v1/events/{id}/notify\`

**Champs :**

| Champ | Type | Requis | Description |
|-------|------|--------|-------------|
| subject | string | ✅ | Objet de l'email |
| message | string | ✅ | Contenu (supporte les sauts de ligne) |
| target | string | | \`all\`, \`confirmed\`, ou \`waitlist\` (défaut: all) |
| includeEventDetails | boolean | | Inclure les détails de l'événement (défaut: true) |

**Exemple :**

Brief :
> "Envoie un rappel aux inscrits du meetup IA pour leur dire que c'est demain"

Requête :
\`\`\`json
{
  "subject": "Rappel : Meetup IA demain !",
  "message": "N'oubliez pas notre événement demain à 19h.\\n\\nNous avons hâte de vous voir !",
  "target": "confirmed"
}
\`\`\`

**Mode aperçu :** Ajouter \`?preview=true\` pour voir sans envoyer.

---

## Webhooks

### Créer un webhook

\`POST /api/v1/webhooks\`

**Champs :**

| Champ | Type | Requis | Description |
|-------|------|--------|-------------|
| url | string | ✅ | URL de destination (HTTPS en prod) |
| events | array | ✅ | Événements à écouter |
| secret | string | | Secret pour signature (généré si omis) |

**Événements disponibles :**
- \`registration.created\` : Nouvelle inscription
- \`registration.cancelled\` : Annulation
- \`registration.promoted\` : Promotion depuis waitlist
- \`event.created\` : Nouvel événement
- \`event.updated\` : Modification
- \`event.published\` : Publication
- \`event.cancelled\` : Annulation

**Exemple :**
\`\`\`json
{
  "url": "https://mon-serveur.com/webhook",
  "events": ["registration.created", "registration.cancelled"]
}
\`\`\`

### Vérifier les signatures

Les payloads sont signés avec HMAC-SHA256. Header : \`X-EventLite-Signature: sha256=<signature>\`

\`\`\`javascript
const crypto = require('crypto');
const signature = crypto
  .createHmac('sha256', webhookSecret)
  .update(JSON.stringify(payload))
  .digest('hex');
const isValid = \`sha256=\${signature}\` === headers['x-eventlite-signature'];
\`\`\`

---

## Statistiques

### Stats globales

\`GET /api/v1/stats\`

Retourne : nombre d'événements par statut, inscriptions, événements à venir, activité récente.

### Stats d'un événement

\`GET /api/v1/stats/events/{id}\`

Retourne : détails de l'événement, inscriptions (confirmed/waitlist/cancelled), taux de remplissage, timeline.

---

## Upload d'images

\`POST /api/v1/upload\`

**3 méthodes :**

1. **Fichier direct** (multipart/form-data)
2. **URL externe** : \`{ "url": "https://..." }\`
3. **Base64** : \`{ "base64": "data:image/png;base64,..." }\`

L'URL retournée peut être utilisée dans \`coverImage\` lors de la création d'événement.

---

## Workflow complet - Exemple

Brief :
> "Crée un workshop React le 20 mars à 14h chez Google Paris, 30 places, et inscris alice@test.com et bob@test.com"

**Étape 1 : Créer l'événement**
\`\`\`bash
POST /api/v1/events
{
  "title": "Workshop React",
  "mode": "IN_PERSON",
  "location": "Google Paris",
  "startAt": "2025-03-20T14:00:00+01:00",
  "capacity": 30
}
\`\`\`

**Étape 2 : Publier**
\`\`\`bash
PATCH /api/v1/events/{id}
{ "status": "PUBLISHED" }
\`\`\`

**Étape 3 : Inscrire les participants**
\`\`\`bash
POST /api/v1/events/{id}/registrations
{ "email": "alice@test.com", "name": "Alice Martin" }

POST /api/v1/events/{id}/registrations
{ "email": "bob@test.com", "name": "Bob Dupont" }
\`\`\`

---

## Codes d'erreur

| Code | Signification |
|------|---------------|
| 400 | Données invalides |
| 401 | Non authentifié (API key manquante/invalide) |
| 403 | Non autorisé (pas propriétaire de la ressource) |
| 404 | Ressource non trouvée |
| 500 | Erreur serveur |

---

## Spécification OpenAPI

Pour la spécification machine-readable complète : \`GET /api/v1/openapi\`
`;

/**
 * GET /llms-full.txt
 * Documentation complète pour les LLM
 */
export async function GET(request: NextRequest) {
  const host = request.headers.get("host") || "localhost:3333";
  const protocol = host.includes("localhost") ? "http" : "https";
  const baseUrl = `${protocol}://${host}`;

  // Remplacer les chemins relatifs par des URLs absolues
  const content = llmsFullTxt
    .replace(/`(GET|POST|PATCH|DELETE) \//g, `\`$1 ${baseUrl}/`)
    .replace(/`GET \/api/g, `\`GET ${baseUrl}/api`);

  return new Response(content, {
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
