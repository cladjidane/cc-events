"use server";

import { db } from "@/lib/db";
import { registrationSchema } from "@/lib/validations";
import { RegistrationStatus, EventStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { formatDateRange } from "@/lib/utils";
import { sendEmail } from "@/lib/email";
import { ConfirmationEmail } from "@/emails/confirmation";
import { NewRegistrationOrganizerEmail } from "@/emails/new-registration-organizer";
import { WaitlistPromotedEmail } from "@/emails/waitlist-promoted";
import { CancellationConfirmationEmail } from "@/emails/cancellation-confirmation";
import { CancellationOrganizerEmail } from "@/emails/cancellation-organizer";
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
      // Récupérer l'événement avec verrouillage et infos organisateur
      const event = await tx.event.findUnique({
        where: { id: eventId },
        include: {
          organizer: {
            select: { email: true, name: true },
          },
          registrations: {
            where: { status: { not: RegistrationStatus.CANCELLED } },
            select: { status: true },
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

      // Calculer les counts
      const confirmedCount = event.registrations.filter(
        (r) => r.status === RegistrationStatus.CONFIRMED
      ).length;
      const waitlistCount = event.registrations.filter(
        (r) => r.status === RegistrationStatus.WAITLIST
      ).length;

      if (existingRegistration) {
        if (existingRegistration.status === RegistrationStatus.CANCELLED) {
          // Réactiver l'inscription annulée
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
            confirmedCount: newStatus === RegistrationStatus.CONFIRMED ? confirmedCount + 1 : confirmedCount,
            waitlistCount: newStatus === RegistrationStatus.WAITLIST ? waitlistCount + 1 : waitlistCount,
          };
        }

        throw new Error("Vous êtes déjà inscrit à cet événement");
      }

      // 4. Déterminer le statut
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

      return {
        status,
        message,
        registration,
        event,
        confirmedCount: status === RegistrationStatus.CONFIRMED ? confirmedCount + 1 : confirmedCount,
        waitlistCount: status === RegistrationStatus.WAITLIST ? waitlistCount + 1 : waitlistCount,
      };
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
    }).catch((err) => console.error("Erreur envoi email participant:", err));

    // 8. Envoyer email à l'organisateur (async)
    sendEmail({
      to: result.event.organizer.email,
      subject: `Nouvelle inscription - ${result.event.title}`,
      react: NewRegistrationOrganizerEmail({
        organizerName: result.event.organizer.name || "Organisateur",
        participantName: `${firstName} ${lastName}`,
        participantEmail: email,
        eventTitle: result.event.title,
        eventDate: formatDateRange(result.event.startAt, result.event.endAt),
        registrationStatus: result.status as "CONFIRMED" | "WAITLIST",
        confirmedCount: result.confirmedCount,
        capacity: result.event.capacity,
        waitlistCount: result.waitlistCount,
        dashboardUrl: `${appUrl}/dashboard/events/${result.event.id}/registrations`,
        notes: notes || undefined,
      }),
    }).catch((err) => console.error("Erreur envoi email organisateur:", err));

    // 9. Déclencher les webhooks (async, ne bloque pas la réponse)
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
  const appUrl = process.env.APP_URL || "http://localhost:3000";

  try {
    const registration = await db.registration.findUnique({
      where: { cancelToken },
      include: {
        event: {
          include: {
            organizer: { select: { email: true, name: true } },
            registrations: {
              where: { status: { not: RegistrationStatus.CANCELLED } },
              select: { status: true },
            },
          },
        },
      },
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

        // Envoyer email au participant promu
        sendEmail({
          to: nextInWaitlist.email,
          subject: `Bonne nouvelle ! Place confirmée - ${registration.event.title}`,
          react: WaitlistPromotedEmail({
            firstName: nextInWaitlist.firstName,
            eventTitle: registration.event.title,
            eventDate: formatDateRange(registration.event.startAt, registration.event.endAt),
            eventLocation: registration.event.location || undefined,
            isOnline: registration.event.mode === "ONLINE",
            eventUrl: `${appUrl}/e/${registration.event.slug}`,
            cancelUrl: `${appUrl}/cancel/${nextInWaitlist.cancelToken}`,
          }),
        }).catch((err) => console.error("Erreur envoi email promotion:", err));

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

    // Calculer les counts après annulation
    const confirmedCount = registration.event.registrations.filter(
      (r) => r.status === RegistrationStatus.CONFIRMED
    ).length - (registration.status === RegistrationStatus.CONFIRMED ? 1 : 0);
    const waitlistCount = registration.event.registrations.filter(
      (r) => r.status === RegistrationStatus.WAITLIST
    ).length - (registration.status === RegistrationStatus.WAITLIST ? 1 : 0);

    // Envoyer email de confirmation d'annulation au participant
    sendEmail({
      to: registration.email,
      subject: `Inscription annulée - ${registration.event.title}`,
      react: CancellationConfirmationEmail({
        firstName: registration.firstName,
        eventTitle: registration.event.title,
        eventDate: formatDateRange(registration.event.startAt, registration.event.endAt),
        eventUrl: `${appUrl}/e/${registration.event.slug}`,
      }),
    }).catch((err) => console.error("Erreur envoi email annulation participant:", err));

    // Trouver si quelqu'un a été promu (pour l'email organisateur)
    const promotedParticipant = registration.status === RegistrationStatus.CONFIRMED
      ? await db.registration.findFirst({
          where: {
            eventId: registration.eventId,
            status: RegistrationStatus.CONFIRMED,
            id: { not: registration.id },
          },
          orderBy: { updatedAt: "desc" },
        })
      : null;

    // Envoyer email à l'organisateur
    sendEmail({
      to: registration.event.organizer.email,
      subject: `Annulation - ${registration.event.title}`,
      react: CancellationOrganizerEmail({
        organizerName: registration.event.organizer.name || "Organisateur",
        participantName: `${registration.firstName} ${registration.lastName}`,
        participantEmail: registration.email,
        eventTitle: registration.event.title,
        eventDate: formatDateRange(registration.event.startAt, registration.event.endAt),
        confirmedCount,
        capacity: registration.event.capacity,
        waitlistCount,
        promotedParticipant: promotedParticipant
          ? {
              name: `${promotedParticipant.firstName} ${promotedParticipant.lastName}`,
              email: promotedParticipant.email,
            }
          : undefined,
        dashboardUrl: `${appUrl}/dashboard/events/${registration.event.id}/registrations`,
      }),
    }).catch((err) => console.error("Erreur envoi email annulation organisateur:", err));

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
