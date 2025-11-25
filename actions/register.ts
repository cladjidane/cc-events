"use server";

import { db } from "@/lib/db";
import { registrationSchema } from "@/lib/validations";
import { RegistrationStatus, EventStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { formatDateRange } from "@/lib/utils";
import { sendEmail } from "@/lib/email";
import { ConfirmationEmail } from "@/emails/confirmation";
import { triggerWebhooks } from "@/lib/webhooks";
import type { ActionResult } from "@/lib/utils";

export type RegistrationResult = ActionResult<{
  status: RegistrationStatus;
  message: string;
}>;

// Vérifier le token Turnstile côté serveur
async function verifyTurnstile(token: string): Promise<boolean> {
  const secretKey = process.env.TURNSTILE_SECRET_KEY;
  if (!secretKey) return true; // Si pas configuré, on laisse passer

  try {
    const response = await fetch(
      "https://challenges.cloudflare.com/turnstile/v0/siteverify",
      {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          secret: secretKey,
          response: token,
        }),
      }
    );
    const data = await response.json();
    return data.success === true;
  } catch {
    return false;
  }
}

export async function registerForEvent(
  _prevState: RegistrationResult | null,
  formData: FormData
): Promise<RegistrationResult> {
  // 0. Vérifier le captcha Turnstile
  const turnstileToken = formData.get("turnstileToken") as string;
  if (process.env.TURNSTILE_SECRET_KEY && turnstileToken) {
    const isValid = await verifyTurnstile(turnstileToken);
    if (!isValid) {
      return {
        success: false,
        error: "Vérification anti-bot échouée. Veuillez réessayer.",
      };
    }
  }

  // 1. Extraire et valider les données
  const rawData = {
    eventId: formData.get("eventId"),
    firstName: formData.get("firstName"),
    lastName: formData.get("lastName"),
    email: formData.get("email"),
    notes: formData.get("notes") || undefined,
  };

  const validated = registrationSchema.safeParse(rawData);

  if (!validated.success) {
    return {
      success: false,
      error: validated.error.issues[0]?.message || "Données invalides",
    };
  }

  const { eventId, firstName, lastName, email, notes } = validated.data;

  try {
    // 2. Transaction pour gérer la concurrence
    const result = await db.$transaction(async (tx) => {
      // Récupérer l'événement avec verrouillage
      const event = await tx.event.findUnique({
        where: { id: eventId },
        include: {
          _count: {
            select: {
              registrations: {
                where: { status: RegistrationStatus.CONFIRMED },
              },
            },
          },
        },
      });

      if (!event) {
        throw new Error("Événement introuvable");
      }

      if (event.status !== EventStatus.PUBLISHED) {
        throw new Error("Cet événement n'accepte pas les inscriptions");
      }

      // Vérifier si la date de l'événement n'est pas passée
      if (new Date(event.startAt) < new Date()) {
        throw new Error("Cet événement est déjà passé");
      }

      // 3. Vérifier si déjà inscrit
      const existingRegistration = await tx.registration.findUnique({
        where: {
          email_eventId: {
            email,
            eventId,
          },
        },
      });

      if (existingRegistration) {
        if (existingRegistration.status === RegistrationStatus.CANCELLED) {
          // Réactiver l'inscription annulée
          const confirmedCount = event._count.registrations;
          const hasCapacity = !event.capacity || confirmedCount < event.capacity;

          const newStatus = hasCapacity
            ? RegistrationStatus.CONFIRMED
            : event.waitlist
              ? RegistrationStatus.WAITLIST
              : null;

          if (!newStatus) {
            throw new Error("L'événement est complet");
          }

          const updatedRegistration = await tx.registration.update({
            where: { id: existingRegistration.id },
            data: {
              status: newStatus,
              firstName,
              lastName,
              notes,
            },
          });

          return {
            status: newStatus,
            message:
              newStatus === RegistrationStatus.CONFIRMED
                ? "Votre inscription a été confirmée !"
                : "Vous avez été ajouté à la liste d'attente.",
            registration: updatedRegistration,
            event,
          };
        }

        throw new Error("Vous êtes déjà inscrit à cet événement");
      }

      // 4. Déterminer le statut
      const confirmedCount = event._count.registrations;
      const hasCapacity = !event.capacity || confirmedCount < event.capacity;

      let status: RegistrationStatus;
      let message: string;

      if (hasCapacity) {
        status = RegistrationStatus.CONFIRMED;
        message = "Votre inscription a été confirmée !";
      } else if (event.waitlist) {
        status = RegistrationStatus.WAITLIST;
        message = "L'événement est complet. Vous avez été ajouté à la liste d'attente.";
      } else {
        throw new Error("L'événement est complet et n'a pas de liste d'attente");
      }

      // 5. Créer l'inscription
      const registration = await tx.registration.create({
        data: {
          eventId,
          firstName,
          lastName,
          email,
          notes,
          status,
        },
      });

      return { status, message, registration, event };
    });

    // 6. Revalider la page
    revalidatePath(`/e/[slug]`, "page");

    // 7. Envoyer email de confirmation (async, ne bloque pas la réponse)
    const appUrl = process.env.APP_URL || "http://localhost:3000";

    sendEmail({
      to: email,
      subject: result.status === RegistrationStatus.WAITLIST
        ? `Liste d'attente - ${result.event.title}`
        : `Inscription confirmée - ${result.event.title}`,
      react: ConfirmationEmail({
        firstName,
        eventTitle: result.event.title,
        eventDate: formatDateRange(result.event.startAt, result.event.endAt),
        eventLocation: result.event.location || undefined,
        isOnline: result.event.mode === "ONLINE",
        cancelUrl: `${appUrl}/cancel/${result.registration.cancelToken}`,
        eventUrl: `${appUrl}/e/${result.event.slug}`,
        isWaitlist: result.status === RegistrationStatus.WAITLIST,
      }),
    }).catch((err) => console.error("Erreur envoi email:", err));

    // 8. Déclencher les webhooks (async, ne bloque pas la réponse)
    triggerWebhooks(result.event.organizerId, "registration.created", {
      registration: {
        id: result.registration.id,
        email: result.registration.email,
        name: `${result.registration.firstName} ${result.registration.lastName}`,
        status: result.registration.status,
      },
      event: {
        id: result.event.id,
        title: result.event.title,
        slug: result.event.slug,
      },
    }).catch((err) => console.error("Erreur webhook:", err));

    return {
      success: true,
      data: { status: result.status, message: result.message },
    };
  } catch (error) {
    console.error("Erreur inscription:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Une erreur est survenue",
    };
  }
}

// Annuler une inscription via le token
export async function cancelRegistration(
  cancelToken: string
): Promise<ActionResult> {
  try {
    const registration = await db.registration.findUnique({
      where: { cancelToken },
      include: { event: true },
    });

    if (!registration) {
      return { success: false, error: "Inscription introuvable" };
    }

    if (registration.status === RegistrationStatus.CANCELLED) {
      return { success: false, error: "Cette inscription a déjà été annulée" };
    }

    // Annuler l'inscription
    await db.registration.update({
      where: { id: registration.id },
      data: { status: RegistrationStatus.CANCELLED },
    });

    // Si l'inscription était confirmée et qu'il y a une liste d'attente,
    // promouvoir le premier en attente
    if (registration.status === RegistrationStatus.CONFIRMED) {
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

        // Déclencher webhook de promotion
        triggerWebhooks(registration.event.organizerId, "registration.promoted", {
          registration: {
            id: nextInWaitlist.id,
            email: nextInWaitlist.email,
            name: `${nextInWaitlist.firstName} ${nextInWaitlist.lastName}`,
            status: "CONFIRMED",
            previous_status: "WAITLIST",
          },
          event: {
            id: registration.event.id,
            title: registration.event.title,
            slug: registration.event.slug,
          },
        }).catch((err) => console.error("Erreur webhook:", err));
      }
    }

    // Déclencher webhook d'annulation
    triggerWebhooks(registration.event.organizerId, "registration.cancelled", {
      registration: {
        id: registration.id,
        email: registration.email,
        name: `${registration.firstName} ${registration.lastName}`,
        status: "CANCELLED",
      },
      event: {
        id: registration.event.id,
        title: registration.event.title,
        slug: registration.event.slug,
      },
    }).catch((err) => console.error("Erreur webhook:", err));

    revalidatePath(`/e/${registration.event.slug}`);

    return { success: true };
  } catch (error) {
    console.error("Erreur annulation:", error);
    return {
      success: false,
      error: "Une erreur est survenue lors de l'annulation",
    };
  }
}
