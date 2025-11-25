"use server";

import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { RegistrationStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";
import type { ActionResult } from "@/lib/utils";

// Vérifier que l'utilisateur est connecté
async function requireAuth() {
  const session = await auth();
  if (!session?.user) {
    throw new Error("Non autorisé");
  }
  return session.user;
}

// Récupérer les inscriptions d'un événement
export async function getRegistrationsForEvent(eventId: string) {
  const session = await auth();
  if (!session?.user) return [];

  // Vérifier que l'utilisateur a accès à cet événement
  const event = await db.event.findUnique({
    where: { id: eventId },
  });

  if (!event) return [];
  if (event.organizerId !== session.user.id && session.user.role !== "ADMIN") {
    return [];
  }

  return db.registration.findMany({
    where: { eventId },
    orderBy: { createdAt: "desc" },
  });
}

// Mettre à jour le statut d'une inscription
export async function updateRegistrationStatus(
  registrationId: string,
  status: RegistrationStatus
): Promise<ActionResult> {
  try {
    const user = await requireAuth();

    const registration = await db.registration.findUnique({
      where: { id: registrationId },
      include: { event: true },
    });

    if (!registration) {
      return { success: false, error: "Inscription introuvable" };
    }

    // Vérifier les droits
    if (
      registration.event.organizerId !== user.id &&
      user.role !== "ADMIN"
    ) {
      return { success: false, error: "Non autorisé" };
    }

    // Si on confirme quelqu'un de la liste d'attente, vérifier la capacité
    if (status === RegistrationStatus.CONFIRMED && registration.status === RegistrationStatus.WAITLIST) {
      const confirmedCount = await db.registration.count({
        where: {
          eventId: registration.eventId,
          status: RegistrationStatus.CONFIRMED,
        },
      });

      if (registration.event.capacity && confirmedCount >= registration.event.capacity) {
        return {
          success: false,
          error: "La capacité maximale est atteinte",
        };
      }
    }

    await db.registration.update({
      where: { id: registrationId },
      data: { status },
    });

    // Si on annule une inscription confirmée, promouvoir le premier en attente
    if (
      status === RegistrationStatus.CANCELLED &&
      registration.status === RegistrationStatus.CONFIRMED
    ) {
      const nextInWaitlist = await db.registration.findFirst({
        where: {
          eventId: registration.eventId,
          status: RegistrationStatus.WAITLIST,
        },
        orderBy: { createdAt: "asc" },
      });

      if (nextInWaitlist) {
        await db.registration.update({
          where: { id: nextInWaitlist.id },
          data: { status: RegistrationStatus.CONFIRMED },
        });
        // TODO: Envoyer email de promotion
      }
    }

    revalidatePath(`/dashboard/events/${registration.eventId}/registrations`);

    return { success: true };
  } catch (error) {
    console.error("Erreur mise à jour inscription:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Une erreur est survenue",
    };
  }
}

// Supprimer une inscription
export async function deleteRegistration(
  registrationId: string
): Promise<ActionResult> {
  try {
    const user = await requireAuth();

    const registration = await db.registration.findUnique({
      where: { id: registrationId },
      include: { event: true },
    });

    if (!registration) {
      return { success: false, error: "Inscription introuvable" };
    }

    if (
      registration.event.organizerId !== user.id &&
      user.role !== "ADMIN"
    ) {
      return { success: false, error: "Non autorisé" };
    }

    const wasConfirmed = registration.status === RegistrationStatus.CONFIRMED;
    const eventId = registration.eventId;

    await db.registration.delete({ where: { id: registrationId } });

    // Si l'inscription était confirmée, promouvoir le premier en attente
    if (wasConfirmed) {
      const nextInWaitlist = await db.registration.findFirst({
        where: {
          eventId,
          status: RegistrationStatus.WAITLIST,
        },
        orderBy: { createdAt: "asc" },
      });

      if (nextInWaitlist) {
        await db.registration.update({
          where: { id: nextInWaitlist.id },
          data: { status: RegistrationStatus.CONFIRMED },
        });
        // TODO: Envoyer email de promotion
      }
    }

    revalidatePath(`/dashboard/events/${eventId}/registrations`);

    return { success: true };
  } catch (error) {
    console.error("Erreur suppression inscription:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Une erreur est survenue",
    };
  }
}

// Statistiques des inscriptions pour un événement
export async function getRegistrationStats(eventId: string) {
  const session = await auth();
  if (!session?.user) return null;

  const event = await db.event.findUnique({
    where: { id: eventId },
  });

  if (!event) return null;
  if (event.organizerId !== session.user.id && session.user.role !== "ADMIN") {
    return null;
  }

  const [confirmed, waitlist, cancelled] = await Promise.all([
    db.registration.count({
      where: { eventId, status: RegistrationStatus.CONFIRMED },
    }),
    db.registration.count({
      where: { eventId, status: RegistrationStatus.WAITLIST },
    }),
    db.registration.count({
      where: { eventId, status: RegistrationStatus.CANCELLED },
    }),
  ]);

  return {
    confirmed,
    waitlist,
    cancelled,
    total: confirmed + waitlist,
    capacity: event.capacity,
    spotsLeft: event.capacity ? Math.max(0, event.capacity - confirmed) : null,
  };
}
