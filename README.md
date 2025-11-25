# EventLite

Plateforme de gestion d'événements AI-first. Interface web pour les humains, API REST complète pour les agents AI.

## Fonctionnalités

- **Gestion d'événements** : Créer, modifier, publier des événements (présentiel ou en ligne)
- **Inscriptions** : Gestion des participants avec capacité et liste d'attente automatique
- **Notifications** : Envoi d'emails personnalisés aux participants
- **Webhooks** : Intégrations temps réel (inscriptions, modifications d'événements)
- **API REST** : Documentation OpenAPI 3.1 complète
- **MCP Server** : Intégration native avec Claude Desktop

## Stack Technique

- **Framework** : Next.js 16 (App Router)
- **Base de données** : PostgreSQL + Prisma ORM
- **Authentification** : NextAuth.js 5
- **UI** : React 19 + Tailwind CSS + Radix UI
- **Email** : Nodemailer (SMTP) + React Email
- **Validation** : Zod
- **Anti-bot** : Cloudflare Turnstile

## Installation

### Prérequis

- Node.js 18+
- pnpm
- Docker (pour PostgreSQL)

### Setup

```bash
# Cloner le projet
git clone <repo-url>
cd cc-events

# Installer les dépendances
pnpm install

# Démarrer PostgreSQL
docker compose up -d

# Configurer l'environnement
cp .env.example .env
# Éditer .env avec vos valeurs

# Initialiser la base de données
pnpm db:push
pnpm db:seed

# Lancer en développement
pnpm dev
```

L'application est accessible sur http://localhost:3333

### Variables d'environnement

```bash
# Database
DATABASE_URL="postgresql://postgres:postgres@localhost:5433/eventlite"
DIRECT_URL="postgresql://postgres:postgres@localhost:5433/eventlite"

# Auth
NEXTAUTH_SECRET="votre-secret-ici"
NEXTAUTH_URL="http://localhost:3333"

# Email (SMTP)
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_USER="votre-email@gmail.com"
SMTP_PASSWORD="votre-app-password"
SMTP_FROM="contact@example.com"
SMTP_FROM_NAME="EventLite"

# Anti-bot (optionnel)
NEXT_PUBLIC_TURNSTILE_SITE_KEY=""
TURNSTILE_SECRET_KEY=""

# File storage
BLOB_READ_WRITE_TOKEN=""

# App
APP_URL="http://localhost:3333"
```

## API REST

### Authentification

L'API utilise une authentification Bearer Token :

```bash
# Générer l'API Key
API_KEY=$(echo -n "votre-email@example.com:$NEXTAUTH_SECRET" | base64)

# Utiliser dans les requêtes
curl -H "Authorization: Bearer $API_KEY" \
  http://localhost:3333/api/v1/events
```

### Endpoints principaux

| Catégorie | Endpoint | Description |
|-----------|----------|-------------|
| **Events** | `GET /api/v1/events` | Liste des événements |
| | `POST /api/v1/events` | Créer un événement |
| | `GET /api/v1/events/{id}` | Détail d'un événement |
| | `PATCH /api/v1/events/{id}` | Modifier |
| | `DELETE /api/v1/events/{id}` | Supprimer |
| **Registrations** | `GET /api/v1/events/{id}/registrations` | Liste des inscrits |
| | `POST /api/v1/events/{id}/registrations` | Inscrire |
| | `DELETE /api/v1/events/{id}/registrations/{email}` | Désinscrire |
| **Notifications** | `POST /api/v1/events/{id}/notify` | Envoyer emails |
| **Webhooks** | `GET /api/v1/webhooks` | Liste |
| | `POST /api/v1/webhooks` | Créer |
| | `POST /api/v1/webhooks/{id}/test` | Tester |
| **Stats** | `GET /api/v1/stats` | Stats globales |
| | `GET /api/v1/stats/events/{id}` | Stats événement |
| **OpenAPI** | `GET /api/v1/openapi` | Spec OpenAPI 3.1 |

### Documentation complète

Voir [API_DOCUMENTATION.md](./API_DOCUMENTATION.md) pour la documentation détaillée.

## MCP Server (Claude)

EventLite inclut un serveur MCP pour intégration avec Claude Desktop.

### Installation

```json
// claude_desktop_config.json
{
  "mcpServers": {
    "eventlite": {
      "command": "node",
      "args": ["/chemin/vers/cc-events/packages/mcp-server/dist/index.js"],
      "env": {
        "EVENTLITE_API_URL": "http://localhost:3333",
        "EVENTLITE_API_KEY": "votre-api-key"
      }
    }
  }
}
```

### Build du MCP Server

```bash
cd packages/mcp-server
pnpm install
pnpm build
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
| `unregister_attendee` | Désinscrire |
| `send_notification` | Envoyer un email |

### Exemple d'utilisation

```
User: "Crée un meetup IA pour vendredi prochain à 19h"
Claude: ✅ Événement créé : Meetup IA
        Slug: meetup-ia
        Status: DRAFT

User: "Publie-le et inscris alice@example.com"
Claude: ✅ Événement publié
        ✅ Alice inscrite avec le statut CONFIRMED
```

## Webhooks

### Événements disponibles

| Événement | Déclenché quand |
|-----------|-----------------|
| `registration.created` | Nouvelle inscription |
| `registration.cancelled` | Annulation |
| `registration.promoted` | Promotion depuis waitlist |
| `event.created` | Nouvel événement |
| `event.updated` | Modification |
| `event.published` | Publication |
| `event.cancelled` | Annulation |

### Exemple de payload

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

Les payloads sont signés avec HMAC-SHA256 (header `X-EventLite-Signature`).

## Structure du projet

```
cc-events/
├── app/                      # Next.js App Router
│   ├── api/v1/              # API REST
│   │   ├── events/          # CRUD événements
│   │   ├── webhooks/        # Webhooks
│   │   ├── stats/           # Statistiques
│   │   └── openapi/         # Spec OpenAPI
│   ├── dashboard/           # Interface admin
│   ├── e/[slug]/            # Pages événements publiques
│   └── login/               # Authentification
├── components/              # Composants React
├── lib/                     # Utilitaires
│   ├── api-auth.ts         # Auth API
│   ├── db.ts               # Prisma client
│   ├── email.ts            # Service email
│   ├── webhooks.ts         # Envoi webhooks
│   └── validations.ts      # Schémas Zod
├── actions/                 # Server Actions
├── emails/                  # Templates React Email
├── prisma/                  # Schema & migrations
├── packages/
│   └── mcp-server/         # MCP Server pour Claude
└── API_DOCUMENTATION.md    # Doc API complète
```

## Scripts

```bash
pnpm dev          # Développement (port 3333)
pnpm build        # Build production
pnpm start        # Démarrer en production
pnpm db:push      # Sync schema Prisma → DB
pnpm db:seed      # Seed la base de données
pnpm db:studio    # Prisma Studio (GUI)
```

## Déploiement

### Vercel

1. Connecter le repo à Vercel
2. Configurer les variables d'environnement
3. Déployer

### Base de données

Utiliser un service PostgreSQL managé :
- Vercel Postgres
- Supabase
- Railway
- Neon

## Licence

MIT
