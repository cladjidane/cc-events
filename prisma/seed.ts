import { PrismaClient, Role, EventStatus, EventMode } from "@prisma/client";
import { hash } from "bcryptjs";
import { addDays, addHours } from "date-fns";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Début du seeding...");

  // Nettoyer la base
  await prisma.registration.deleteMany();
  await prisma.event.deleteMany();
  await prisma.session.deleteMany();
  await prisma.account.deleteMany();
  await prisma.user.deleteMany();

  // Créer l'admin
  const hashedPassword = await hash("admin123", 12);
  const admin = await prisma.user.create({
    data: {
      email: "admin@eventlite.fr",
      password: hashedPassword,
      name: "Administrateur",
      role: Role.ADMIN,
    },
  });
  console.log("✅ Admin créé:", admin.email);

  // Créer un organisateur
  const organizer = await prisma.user.create({
    data: {
      email: "organisateur@eventlite.fr",
      password: hashedPassword,
      name: "Jean Organisateur",
      role: Role.ORGANIZER,
    },
  });
  console.log("✅ Organisateur créé:", organizer.email);

  // Créer le compte Context Collective (admin)
  const ccAdmin = await prisma.user.create({
    data: {
      email: "contact@context-collective.org",
      password: hashedPassword,
      name: "Context Collective",
      role: Role.ADMIN,
    },
  });
  console.log("✅ Context Collective créé:", ccAdmin.email);

  // Événement 1: Publié, en présentiel avec coordonnées GPS
  const event1 = await prisma.event.create({
    data: {
      slug: "conference-tech-2025",
      organizerId: admin.id,
      title: "Conférence Tech 2025",
      subtitle: "L'avenir du développement web",
      description: `Rejoignez-nous pour une journée exceptionnelle dédiée aux dernières technologies web.

Au programme :
- Keynote sur l'IA dans le développement
- Ateliers pratiques React et Next.js
- Networking avec des experts du secteur
- Déjeuner et pause café inclus

Cette conférence s'adresse aux développeurs de tous niveaux souhaitant découvrir les tendances de demain.`,
      mode: EventMode.IN_PERSON,
      location: "Cité des Sciences et de l'Industrie, 30 Avenue Corentin Cariou, 75019 Paris",
      latitude: 48.8959,
      longitude: 2.3872,
      startAt: addDays(new Date(), 30),
      endAt: addHours(addDays(new Date(), 30), 8),
      timezone: "Europe/Paris",
      capacity: 100,
      waitlist: true,
      status: EventStatus.PUBLISHED,
    },
  });
  console.log("✅ Événement créé:", event1.title);

  // Événement 2: Brouillon, en ligne
  const event2 = await prisma.event.create({
    data: {
      slug: "webinaire-ia-generative",
      organizerId: organizer.id,
      title: "Webinaire : Introduction à l'IA Générative",
      subtitle: "Comprendre ChatGPT, Claude et les LLMs",
      description: `Un webinaire d'introduction pour comprendre les fondamentaux de l'IA générative.

Contenu :
- Qu'est-ce qu'un LLM ?
- Comment fonctionnent ChatGPT et Claude ?
- Cas d'usage concrets
- Questions/Réponses

Durée : 2 heures
Niveau : Débutant`,
      mode: EventMode.ONLINE,
      location: "https://zoom.us/j/example",
      startAt: addDays(new Date(), 14),
      endAt: addHours(addDays(new Date(), 14), 2),
      timezone: "Europe/Paris",
      capacity: 50,
      waitlist: false,
      status: EventStatus.DRAFT,
    },
  });
  console.log("✅ Événement créé:", event2.title);

  // Événement 3: Publié, sans limite de capacité, avec coordonnées
  const event3 = await prisma.event.create({
    data: {
      slug: "meetup-react-paris",
      organizerId: admin.id,
      title: "Meetup React Paris",
      subtitle: "Édition spéciale React 19",
      description: `Notre meetup mensuel React revient avec une édition spéciale consacrée à React 19 !

Au programme :
- Les nouveautés de React 19
- Server Components en pratique
- Retours d'expérience

Venez nombreux, l'entrée est gratuite !`,
      mode: EventMode.IN_PERSON,
      location: "WeWork La Défense, 1 Parvis de La Défense, 92800 Puteaux",
      latitude: 48.8920,
      longitude: 2.2378,
      startAt: addDays(new Date(), 7),
      endAt: addHours(addDays(new Date(), 7), 3),
      timezone: "Europe/Paris",
      capacity: null, // Illimité
      waitlist: false,
      status: EventStatus.PUBLISHED,
    },
  });
  console.log("✅ Événement créé:", event3.title);

  // Quelques inscriptions de test
  await prisma.registration.createMany({
    data: [
      {
        eventId: event1.id,
        email: "marie.dupont@email.com",
        firstName: "Marie",
        lastName: "Dupont",
        notes: "Végétarienne pour le repas",
      },
      {
        eventId: event1.id,
        email: "pierre.martin@email.com",
        firstName: "Pierre",
        lastName: "Martin",
      },
      {
        eventId: event3.id,
        email: "sophie.bernard@email.com",
        firstName: "Sophie",
        lastName: "Bernard",
        notes: "Première participation",
      },
    ],
  });
  console.log("✅ 3 inscriptions créées");

  console.log("🌱 Seeding terminé !");
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
