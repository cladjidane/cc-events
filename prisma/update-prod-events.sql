-- Script à exécuter dans la console Neon SQL Editor
-- ================================================

-- 1. Supprimer les inscriptions existantes
DELETE FROM "Registration";

-- 2. Supprimer les événements existants
DELETE FROM "Event";

-- 3. Créer l'événement "Les Skills de Claude" - 27 nov 13h-14h
INSERT INTO "Event" (
  id, slug, "organizerId", title, subtitle, description, mode, location,
  "startAt", "endAt", timezone, capacity, waitlist, status, "createdAt", "updatedAt"
) VALUES (
  gen_random_uuid(),
  'les-skills-de-claude',
  (SELECT id FROM "User" WHERE email = 'contact@context-collective.org'),
  'Les Skills de Claude',
  'Découvrez les capacités avancées de Claude Code',
  '## Webinaire : Les Skills de Claude

Rejoignez-nous pour découvrir les **Skills** de Claude, une fonctionnalité puissante qui permet d''étendre les capacités de Claude Code.

### Au programme :

- **Qu''est-ce qu''un Skill ?** - Comprendre le concept et son utilité
- **Les Skills natifs** - Tour d''horizon des skills intégrés (PDF, XLSX, etc.)
- **Créer ses propres Skills** - Structure et bonnes pratiques
- **Démo live** - Création d''un skill personnalisé en direct
- **Questions/Réponses**

### Comment participer ?

Le webinaire sera diffusé en direct sur la chaîne YouTube de Pierre.

🎬 **Lien de la chaîne** : https://www.youtube.com/@PierreAtBTM',
  'ONLINE',
  'https://www.youtube.com/@PierreAtBTM',
  '2025-11-27 12:00:00+00',
  '2025-11-27 13:00:00+00',
  'Europe/Paris',
  NULL,
  false,
  'PUBLISHED',
  NOW(),
  NOW()
);

-- 4. Créer l'événement "Lab IA au Totem" - 10 déc 18h30
INSERT INTO "Event" (
  id, slug, "organizerId", title, subtitle, description, mode, location,
  latitude, longitude, "startAt", "endAt", timezone, capacity, waitlist, status, "createdAt", "updatedAt"
) VALUES (
  gen_random_uuid(),
  'lab-ia-totem-brest',
  (SELECT id FROM "User" WHERE email = 'contact@context-collective.org'),
  'Lab IA au Totem',
  'Atelier pratique autour de l''intelligence artificielle',
  '## Lab IA - Atelier pratique

Venez explorer les possibilités offertes par l''intelligence artificielle lors de cet atelier collaboratif au Totem.

### Au programme :

- Découverte des outils IA actuels
- Expérimentations pratiques
- Échanges et partage d''expériences
- Cas d''usage concrets

### Informations pratiques :

- **Lieu** : Le Totem, aux Capucins de Brest
- **Places limitées** : 12 participants maximum
- **Niveau** : Tous niveaux bienvenus

Venez avec votre ordinateur portable pour participer aux exercices pratiques !',
  'IN_PERSON',
  'Le Totem, Les Capucins, 25 rue de Pontaniou, 29200 Brest',
  48.3833,
  -4.4961,
  '2025-12-10 17:30:00+00',
  '2025-12-10 20:00:00+00',
  'Europe/Paris',
  12,
  true,
  'PUBLISHED',
  NOW(),
  NOW()
);

-- Vérifier le résultat
SELECT slug, title, "startAt", capacity, status FROM "Event";
