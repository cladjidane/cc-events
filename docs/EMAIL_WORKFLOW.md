# Workflow des Emails et Notifications

Documentation interne du système d'emails EventLite.

## Vue d'ensemble

EventLite envoie des emails automatiques à deux types de destinataires :
- **Participants** : personnes inscrites aux événements
- **Organisateurs** : propriétaires des événements

## Architecture technique

### Stack
- **Envoi** : Nodemailer (SMTP)
- **Templates** : React Email (`@react-email/components`)
- **Async** : Les emails sont envoyés de manière asynchrone (ne bloquent pas la réponse)

### Configuration SMTP
```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=votre-email@gmail.com
SMTP_PASSWORD=votre-app-password
SMTP_FROM=contact@example.com
SMTP_FROM_NAME=EventLite
```

### Fichiers clés
```
emails/
├── base-template.tsx          # Layout de base (header, footer, styles)
├── confirmation.tsx           # Confirmation inscription participant
├── new-registration-organizer.tsx  # Notification inscription → organisateur
├── waitlist-promoted.tsx      # Promotion waitlist → participant
├── cancellation-confirmation.tsx   # Confirmation annulation → participant
├── cancellation-organizer.tsx      # Notification annulation → organisateur
├── custom-notification.tsx    # Notification manuelle (API)
└── event-approval.tsx         # Magic link création IA

lib/
└── email.ts                   # Fonction sendEmail()
```

---

## Flux des emails

### 1. Inscription à un événement

**Déclencheur** : `actions/register.ts` → `registerForEvent()`

```
┌─────────────────────────────────────────────────────────────────┐
│                     INSCRIPTION                                  │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Participant s'inscrit                                          │
│         │                                                        │
│         ▼                                                        │
│  ┌─────────────────┐                                            │
│  │ Places dispo ?  │                                            │
│  └────────┬────────┘                                            │
│           │                                                      │
│     ┌─────┴─────┐                                               │
│     │           │                                                │
│    OUI         NON                                               │
│     │           │                                                │
│     ▼           ▼                                                │
│ CONFIRMED   Waitlist ?                                          │
│     │           │                                                │
│     │     ┌─────┴─────┐                                         │
│     │    OUI         NON                                         │
│     │     │           │                                          │
│     │     ▼           ▼                                          │
│     │  WAITLIST    ERREUR                                       │
│     │     │        (complet)                                     │
│     │     │                                                      │
│     ▼     ▼                                                      │
│  ┌──────────────────────────────────────────┐                   │
│  │           ENVOI EMAILS                    │                   │
│  ├──────────────────────────────────────────┤                   │
│  │                                           │                   │
│  │  → Participant : confirmation.tsx         │                   │
│  │    Subject: "Inscription confirmée - X"   │                   │
│  │         ou "Liste d'attente - X"          │                   │
│  │                                           │                   │
│  │  → Organisateur : new-registration-       │                   │
│  │    organizer.tsx                          │                   │
│  │    Subject: "Nouvelle inscription - X"    │                   │
│  │                                           │                   │
│  └──────────────────────────────────────────┘                   │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

**Contenu email participant** :
- Titre de l'événement
- Date et heure
- Lieu (ou lien si en ligne)
- Bouton "Voir l'événement"
- Lien d'annulation

**Contenu email organisateur** :
- Nom et email du participant
- Notes (si renseignées)
- Statut (confirmé ou waitlist)
- Compteur inscrits/capacité
- Bouton "Gérer les inscriptions"

---

### 2. Annulation d'inscription

**Déclencheur** : `actions/register.ts` → `cancelRegistration()`

```
┌─────────────────────────────────────────────────────────────────┐
│                     ANNULATION                                   │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Participant clique sur lien d'annulation                       │
│         │                                                        │
│         ▼                                                        │
│  ┌─────────────────┐                                            │
│  │ Statut actuel ? │                                            │
│  └────────┬────────┘                                            │
│           │                                                      │
│     ┌─────┴─────┐                                               │
│     │           │                                                │
│ CONFIRMED    WAITLIST                                            │
│     │           │                                                │
│     ▼           │                                                │
│  Quelqu'un      │                                                │
│  en waitlist ?  │                                                │
│     │           │                                                │
│  ┌──┴──┐        │                                               │
│ OUI   NON       │                                                │
│  │     │        │                                                │
│  ▼     │        │                                                │
│ PROMOTION       │                                                │
│  │     │        │                                                │
│  ▼     ▼        ▼                                                │
│  ┌──────────────────────────────────────────┐                   │
│  │           ENVOI EMAILS                    │                   │
│  ├──────────────────────────────────────────┤                   │
│  │                                           │                   │
│  │  → Participant : cancellation-            │                   │
│  │    confirmation.tsx                       │                   │
│  │    Subject: "Inscription annulée - X"     │                   │
│  │                                           │                   │
│  │  → Organisateur : cancellation-           │                   │
│  │    organizer.tsx                          │                   │
│  │    Subject: "Annulation - X"              │                   │
│  │    (inclut info promotion si applicable)  │                   │
│  │                                           │                   │
│  │  → Participant promu (si applicable) :    │                   │
│  │    waitlist-promoted.tsx                  │                   │
│  │    Subject: "Bonne nouvelle ! Place       │                   │
│  │              confirmée - X"               │                   │
│  │                                           │                   │
│  └──────────────────────────────────────────┘                   │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

**Contenu email annulation participant** :
- Confirmation de l'annulation
- Détails de l'événement
- Invitation à se réinscrire

**Contenu email annulation organisateur** :
- Nom et email du participant ayant annulé
- Compteurs mis à jour
- Info sur la promotion automatique (si quelqu'un promu)
- Bouton "Gérer les inscriptions"

**Contenu email promotion waitlist** :
- Message positif "Une place s'est libérée !"
- Confirmation que l'inscription est maintenant confirmée
- Détails de l'événement
- Lien d'annulation (au cas où)

---

### 3. Création d'événement via IA

**Déclencheur** : `app/api/v1/events/request/route.ts`

```
┌─────────────────────────────────────────────────────────────────┐
│                 CRÉATION VIA IA                                  │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Utilisateur soumet un brief sur /create-with-ai                │
│         │                                                        │
│         ▼                                                        │
│  ┌─────────────────┐                                            │
│  │  IA parse le    │                                            │
│  │  brief (Groq)   │                                            │
│  └────────┬────────┘                                            │
│           │                                                      │
│           ▼                                                      │
│  Utilisateur vérifie et entre son email                         │
│         │                                                        │
│         ▼                                                        │
│  ┌─────────────────┐                                            │
│  │ Compte existe ? │                                            │
│  └────────┬────────┘                                            │
│           │                                                      │
│     ┌─────┴─────┐                                               │
│    OUI         NON                                               │
│     │           │                                                │
│     │           ▼                                                │
│     │        ERREUR                                              │
│     │        (compte requis)                                     │
│     │                                                            │
│     ▼                                                            │
│  ┌──────────────────────────────────────────┐                   │
│  │           ENVOI EMAIL                     │                   │
│  ├──────────────────────────────────────────┤                   │
│  │                                           │                   │
│  │  → Organisateur : event-approval.tsx      │                   │
│  │    Subject: "Validez votre événement : X" │                   │
│  │                                           │                   │
│  │    Contient 3 boutons :                   │                   │
│  │    - [Publier l'événement]                │                   │
│  │    - [Enregistrer en brouillon]           │                   │
│  │    - [Refuser et supprimer]               │                   │
│  │                                           │                   │
│  │    Token expire après 24h                 │                   │
│  │                                           │                   │
│  └──────────────────────────────────────────┘                   │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

### 4. Notification manuelle (API)

**Déclencheur** : `POST /api/v1/events/{id}/notify`

```
┌─────────────────────────────────────────────────────────────────┐
│              NOTIFICATION MANUELLE                               │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Organisateur appelle l'API avec :                              │
│  - subject: "Objet du mail"                                     │
│  - message: "Contenu du message"                                │
│  - target: "all" | "confirmed" | "waitlist"                     │
│         │                                                        │
│         ▼                                                        │
│  ┌──────────────────────────────────────────┐                   │
│  │           ENVOI EMAILS                    │                   │
│  ├──────────────────────────────────────────┤                   │
│  │                                           │                   │
│  │  → Chaque participant ciblé :             │                   │
│  │    custom-notification.tsx                │                   │
│  │                                           │                   │
│  │    Inclut optionnellement les détails     │                   │
│  │    de l'événement (includeEventDetails)   │                   │
│  │                                           │                   │
│  └──────────────────────────────────────────┘                   │
│                                                                  │
│  Mode preview disponible : ?preview=true                        │
│  (retourne le contenu sans envoyer)                             │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Webhooks

En parallèle des emails, des webhooks sont déclenchés pour les intégrations externes.

| Événement | Payload |
|-----------|---------|
| `registration.created` | Infos inscription + événement |
| `registration.cancelled` | Infos inscription + événement |
| `registration.promoted` | Infos inscription + ancien statut |
| `event.created` | Infos événement |
| `event.updated` | Infos événement |
| `event.published` | Infos événement |
| `event.cancelled` | Infos événement |

---

## Templates email

### Structure de base

Tous les emails utilisent `base-template.tsx` qui fournit :

```
┌─────────────────────────────────────────┐
│  ┌─────────────────────────────────┐   │
│  │  [Logo] EventLite               │   │  ← Header
│  └─────────────────────────────────┘   │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │                                  │   │
│  │     TITRE DE L'EMAIL            │   │  ← Heading
│  │                                  │   │
│  └─────────────────────────────────┘   │
│                                         │
│  Contenu spécifique au template...     │  ← Children
│                                         │
│  ─────────────────────────────────────  │  ← HR
│                                         │
│  Cet email a été envoyé automatiquement │  ← Footer
│  EventLite - Gestion d'événements       │
│                                         │
└─────────────────────────────────────────┘
```

### Styles partagés

Les styles sont exportés depuis `base-template.tsx` :

- `paragraph` - Texte standard
- `detailsSection` - Bloc gris avec infos
- `detailsTitle` - Titre de section (uppercase)
- `detailsText` - Ligne d'info
- `detailsHighlight` - Texte mis en avant
- `buttonPrimary` - Bouton vert (action principale)
- `buttonSecondary` - Bouton noir (action secondaire)
- `buttonOutline` - Bouton avec bordure
- `alertBox` - Encart jaune (warning)
- `alertBoxSuccess` - Encart vert (success)
- `link` - Lien cliquable

---

## Variables d'environnement

| Variable | Description | Requis |
|----------|-------------|--------|
| `SMTP_HOST` | Serveur SMTP | Oui |
| `SMTP_PORT` | Port SMTP (587 ou 465) | Oui |
| `SMTP_USER` | Utilisateur SMTP | Oui |
| `SMTP_PASSWORD` | Mot de passe SMTP | Oui |
| `SMTP_FROM` | Email expéditeur | Non (défaut: contact@...) |
| `SMTP_FROM_NAME` | Nom expéditeur | Non (défaut: EventLite) |
| `SMTP_SECURE` | SSL/TLS (true pour port 465) | Non |
| `APP_URL` | URL de l'application | Non (défaut: localhost:3000) |

---

## Debugging

### Logs

Tous les envois d'emails sont loggés :

```
[EMAIL] Sent to user@example.com: <message-id>
[EMAIL] SMTP not configured. Set SMTP_HOST, SMTP_USER, SMTP_PASSWORD
```

Les erreurs sont catchées et loggées sans bloquer :

```
Erreur envoi email participant: <error>
Erreur envoi email organisateur: <error>
```

### Mode mock

Si SMTP n'est pas configuré, les emails sont mockés :

```
[EMAIL MOCK] To: user@example.com, Subject: Inscription confirmée
```

### Preview (API notify)

Utiliser `?preview=true` sur l'endpoint `/api/v1/events/{id}/notify` pour voir le contenu sans envoyer.

---

## Évolutions futures

- [ ] Rappel J-1 avant événement (cron job)
- [ ] Rappel J-7 avant événement (cron job)
- [ ] Email post-événement (feedback/remerciements)
- [ ] Notification de modification d'événement aux inscrits
- [ ] Résumé hebdomadaire pour les organisateurs
- [ ] Templates personnalisables par organisateur
