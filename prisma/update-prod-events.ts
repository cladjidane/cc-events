import { PrismaClient, EventStatus, EventMode } from "@prisma/client";

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
});

async function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function main() {
  // Retry logic for cold start
  let connected = false;
  for (let i = 0; i < 3; i++) {
    try {
      await prisma.$connect();
      connected = true;
      break;
    } catch (e) {
      console.log(`⏳ Tentative de connexion ${i + 1}/3...`);
      await sleep(2000);
    }
  }
  if (!connected) {
    console.error("❌ Impossible de se connecter à la base de données");
    process.exit(1);
  }
  console.log("🔄 Mise à jour des événements en production...");

  // Trouver l'organisateur Context Collective
  const ccAdmin = await prisma.user.findUnique({
    where: { email: "contact@context-collective.org" },
  });

  if (!ccAdmin) {
    console.error("❌ Utilisateur contact@context-collective.org non trouvé");
    process.exit(1);
  }

  console.log("✅ Organisateur trouvé:", ccAdmin.name);

  // Supprimer toutes les inscriptions et événements existants
  const deletedRegistrations = await prisma.registration.deleteMany();
  console.log(`🗑️  ${deletedRegistrations.count} inscriptions supprimées`);

  const deletedEvents = await prisma.event.deleteMany();
  console.log(`🗑️  ${deletedEvents.count} événements supprimés`);

  // Événement 1: Les Skills de Claude - 27 novembre 2024, 13h-14h, en ligne
  const event1 = await prisma.event.create({
    data: {
      slug: "les-skills-de-claude",
      organizerId: ccAdmin.id,
      title: "Les Skills de Claude",
      subtitle: "Découvrez les capacités avancées de Claude Code",
      description: `## Webinaire : Les Skills de Claude

Rejoignez-nous pour découvrir les **Skills** de Claude, une fonctionnalité puissante qui permet d'étendre les capacités de Claude Code.

### Au programme :

- **Qu'est-ce qu'un Skill ?** - Comprendre le concept et son utilité
- **Les Skills natifs** - Tour d'horizon des skills intégrés (PDF, XLSX, etc.)
- **Créer ses propres Skills** - Structure et bonnes pratiques
- **Démo live** - Création d'un skill personnalisé en direct
- **Questions/Réponses**

### Pour qui ?

Ce webinaire s'adresse aux développeurs et utilisateurs de Claude Code souhaitant optimiser leur workflow et automatiser des tâches répétitives.

### Comment participer ?

Le webinaire sera diffusé en direct sur la chaîne YouTube de Pierre.

🎬 **Lien de la chaîne** : https://www.youtube.com/@PierreAtBTM`,
      mode: EventMode.ONLINE,
      location: "https://www.youtube.com/@PierreAtBTM",
      startAt: new Date("2024-11-27T13:00:00+01:00"),
      endAt: new Date("2024-11-27T14:00:00+01:00"),
      timezone: "Europe/Paris",
      capacity: null, // Illimité (c'est un stream YouTube)
      waitlist: false,
      status: EventStatus.PUBLISHED,
    },
  });
  console.log("✅ Événement créé:", event1.title);

  // Événement 2: Lab IA au Totem - 10 décembre 2024, 18h30, en présentiel
  const event2 = await prisma.event.create({
    data: {
      slug: "lab-ia-totem-brest",
      organizerId: ccAdmin.id,
      title: "Lab IA au Totem",
      subtitle: "Atelier pratique autour de l'intelligence artificielle",
      description: `## Lab IA - Atelier pratique

Venez explorer les possibilités offertes par l'intelligence artificielle lors de cet atelier collaboratif au Totem.

### Au programme :

- Découverte des outils IA actuels
- Expérimentations pratiques
- Échanges et partage d'expériences
- Cas d'usage concrets

### Informations pratiques :

- **Lieu** : Le Totem, aux Capucins de Brest
- **Places limitées** : 12 participants maximum
- **Niveau** : Tous niveaux bienvenus

Venez avec votre ordinateur portable pour participer aux exercices pratiques !`,
      mode: EventMode.IN_PERSON,
      location: "Le Totem, Les Capucins, 25 rue de Pontaniou, 29200 Brest",
      latitude: 48.3833,
      longitude: -4.4961,
      startAt: new Date("2024-12-10T18:30:00+01:00"),
      endAt: new Date("2024-12-10T21:00:00+01:00"),
      timezone: "Europe/Paris",
      capacity: 12,
      waitlist: true,
      status: EventStatus.PUBLISHED,
    },
  });
  console.log("✅ Événement créé:", event2.title);

  console.log("\n🎉 Mise à jour terminée !");
  console.log("   - 2 nouveaux événements créés");
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
