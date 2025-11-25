"use server";

import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { eventSchema } from "@/lib/validations";
import { slugify, type ActionResult } from "@/lib/utils";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { Event } from "@prisma/client";

// Vérifier que l'utilisateur est connecté
async function requireAuth() {
  const session = await auth();
  if (!session?.user) {
    throw new Error("Non autorisé");
  }
  return session.user;
}

// Créer un événement
export async function createEvent(
  _prevState: ActionResult<Event> | null,
  formData: FormData
): Promise<ActionResult<Event>> {
  try {
    const user = await requireAuth();

    const latitudeStr = formData.get("latitude");
    const longitudeStr = formData.get("longitude");

    // Calculer endAt automatiquement (startAt + 2h)
    const startAtValue = formData.get("startAt");
    const startAtDate = startAtValue ? new Date(startAtValue as string) : new Date();
    const endAtDate = new Date(startAtDate.getTime() + 2 * 60 * 60 * 1000);

    const rawData = {
      title: formData.get("title"),
      subtitle: formData.get("subtitle") || undefined,
      description: formData.get("description") || undefined,
      mode: formData.get("mode"),
      location: formData.get("location") || undefined,
      latitude: latitudeStr && latitudeStr !== "" ? Number(latitudeStr) : null,
      longitude: longitudeStr && longitudeStr !== "" ? Number(longitudeStr) : null,
      startAt: startAtValue,
      endAt: endAtDate.toISOString(),
      timezone: formData.get("timezone") || "Europe/Paris",
      capacity: formData.get("capacity") ? Number(formData.get("capacity")) : null,
      waitlist: formData.get("waitlist") === "true",
      status: formData.get("status"),
    };

    const validated = eventSchema.safeParse(rawData);

    if (!validated.success) {
      return {
        success: false,
        error: validated.error.issues[0]?.message || "Données invalides",
      };
    }

    // Générer un slug unique
    let slug = slugify(validated.data.title);
    const existingSlug = await db.event.findUnique({ where: { slug } });
    if (existingSlug) {
      slug = `${slug}-${Date.now().toString(36)}`;
    }

    const event = await db.event.create({
      data: {
        ...validated.data,
        slug,
        organizerId: user.id,
      },
    });

    revalidatePath("/dashboard/events");

    return { success: true, data: event };
  } catch (error) {
    console.error("Erreur création événement:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Une erreur est survenue",
    };
  }
}

// Mettre à jour un événement
export async function updateEvent(
  eventId: string,
  _prevState: ActionResult<Event> | null,
  formData: FormData
): Promise<ActionResult<Event>> {
  try {
    const user = await requireAuth();

    const existingEvent = await db.event.findUnique({
      where: { id: eventId },
    });

    if (!existingEvent) {
      return { success: false, error: "Événement introuvable" };
    }

    // Vérifier que l'utilisateur est propriétaire ou admin
    if (existingEvent.organizerId !== user.id && user.role !== "ADMIN") {
      return { success: false, error: "Non autorisé" };
    }

    const latitudeStr = formData.get("latitude");
    const longitudeStr = formData.get("longitude");

    // Calculer endAt automatiquement (startAt + 2h)
    const startAtValue = formData.get("startAt");
    const startAtDate = startAtValue ? new Date(startAtValue as string) : new Date();
    const endAtDate = new Date(startAtDate.getTime() + 2 * 60 * 60 * 1000);

    const rawData = {
      title: formData.get("title"),
      subtitle: formData.get("subtitle") || undefined,
      description: formData.get("description") || undefined,
      mode: formData.get("mode"),
      location: formData.get("location") || undefined,
      latitude: latitudeStr && latitudeStr !== "" ? Number(latitudeStr) : null,
      longitude: longitudeStr && longitudeStr !== "" ? Number(longitudeStr) : null,
      startAt: startAtValue,
      endAt: endAtDate.toISOString(),
      timezone: formData.get("timezone") || "Europe/Paris",
      capacity: formData.get("capacity") ? Number(formData.get("capacity")) : null,
      waitlist: formData.get("waitlist") === "true",
      status: formData.get("status"),
    };

    const validated = eventSchema.safeParse(rawData);

    if (!validated.success) {
      return {
        success: false,
        error: validated.error.issues[0]?.message || "Données invalides",
      };
    }

    // Mettre à jour le slug si le titre a changé
    let slug = existingEvent.slug;
    if (validated.data.title !== existingEvent.title) {
      slug = slugify(validated.data.title);
      const existingSlug = await db.event.findFirst({
        where: { slug, id: { not: eventId } },
      });
      if (existingSlug) {
        slug = `${slug}-${Date.now().toString(36)}`;
      }
    }

    const event = await db.event.update({
      where: { id: eventId },
      data: {
        ...validated.data,
        slug,
      },
    });

    revalidatePath("/dashboard/events");
    revalidatePath(`/e/${event.slug}`);

    return { success: true, data: event };
  } catch (error) {
    console.error("Erreur mise à jour événement:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Une erreur est survenue",
    };
  }
}

// Supprimer un événement
export async function deleteEvent(eventId: string): Promise<ActionResult> {
  try {
    const user = await requireAuth();

    const existingEvent = await db.event.findUnique({
      where: { id: eventId },
    });

    if (!existingEvent) {
      return { success: false, error: "Événement introuvable" };
    }

    if (existingEvent.organizerId !== user.id && user.role !== "ADMIN") {
      return { success: false, error: "Non autorisé" };
    }

    await db.event.delete({ where: { id: eventId } });

    revalidatePath("/dashboard/events");

    return { success: true };
  } catch (error) {
    console.error("Erreur suppression événement:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Une erreur est survenue",
    };
  }
}

// Récupérer un événement par ID
export async function getEventById(eventId: string) {
  return db.event.findUnique({
    where: { id: eventId },
    include: {
      organizer: {
        select: { name: true, email: true },
      },
      _count: {
        select: { registrations: true },
      },
    },
  });
}

// Récupérer un événement par slug (pour la page publique)
export async function getEventBySlug(slug: string) {
  const event = await db.event.findUnique({
    where: { slug },
    include: {
      organizer: {
        select: { name: true },
      },
    },
  });

  if (!event) return null;

  // Compter séparément les confirmés et la liste d'attente
  const [confirmedCount, waitlistCount] = await Promise.all([
    db.registration.count({
      where: { eventId: event.id, status: "CONFIRMED" },
    }),
    db.registration.count({
      where: { eventId: event.id, status: "WAITLIST" },
    }),
  ]);

  return {
    ...event,
    _count: {
      confirmed: confirmedCount,
      waitlist: waitlistCount,
    },
  };
}

// Liste des événements pour le dashboard
export async function getEventsForDashboard() {
  const session = await auth();
  if (!session?.user) return [];

  const where =
    session.user.role === "ADMIN"
      ? {}
      : { organizerId: session.user.id };

  return db.event.findMany({
    where,
    include: {
      _count: {
        select: { registrations: true },
      },
    },
    orderBy: { startAt: "desc" },
  });
}

// Liste des événements publics
export async function getPublishedEvents() {
  return db.event.findMany({
    where: {
      status: "PUBLISHED",
      startAt: { gte: new Date() },
    },
    orderBy: { startAt: "asc" },
    include: {
      _count: {
        select: {
          registrations: {
            where: { status: "CONFIRMED" },
          },
        },
      },
    },
  });
}
