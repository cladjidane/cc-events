import { Button, Section, Text } from "@react-email/components";
import {
  BaseTemplate,
  paragraph,
  detailsSection,
  detailsTitle,
  detailsText,
  detailsHighlight,
  buttonSection,
  buttonSecondary,
} from "./base-template";

interface NewRegistrationOrganizerEmailProps {
  organizerName: string;
  participantName: string;
  participantEmail: string;
  eventTitle: string;
  eventDate: string;
  registrationStatus: "CONFIRMED" | "WAITLIST";
  confirmedCount: number;
  capacity?: number | null;
  waitlistCount: number;
  dashboardUrl: string;
  notes?: string;
}

export function NewRegistrationOrganizerEmail({
  organizerName,
  participantName,
  participantEmail,
  eventTitle,
  eventDate,
  registrationStatus,
  confirmedCount,
  capacity,
  waitlistCount,
  dashboardUrl,
  notes,
}: NewRegistrationOrganizerEmailProps) {
  const isWaitlist = registrationStatus === "WAITLIST";
  const previewText = `Nouvelle inscription${isWaitlist ? " (liste d'attente)" : ""} : ${participantName} - ${eventTitle}`;

  return (
    <BaseTemplate previewText={previewText} heading="Nouvelle inscription">
      <Text style={paragraph}>Bonjour {organizerName},</Text>

      <Text style={paragraph}>
        {isWaitlist ? (
          <>
            <strong>{participantName}</strong> vient de s'inscrire sur la{" "}
            <strong>liste d'attente</strong> de votre événement.
          </>
        ) : (
          <>
            <strong>{participantName}</strong> vient de s'inscrire à votre
            événement.
          </>
        )}
      </Text>

      <Section style={detailsSection}>
        <Text style={detailsTitle}>Participant</Text>
        <Text style={detailsHighlight}>{participantName}</Text>
        <Text style={detailsText}>
          <strong>Email :</strong> {participantEmail}
        </Text>
        <Text style={detailsText}>
          <strong>Statut :</strong>{" "}
          {isWaitlist ? "En liste d'attente" : "Confirmé"}
        </Text>
        {notes && (
          <Text style={detailsText}>
            <strong>Notes :</strong> {notes}
          </Text>
        )}
      </Section>

      <Section style={detailsSection}>
        <Text style={detailsTitle}>Événement</Text>
        <Text style={detailsHighlight}>{eventTitle}</Text>
        <Text style={detailsText}>
          <strong>Date :</strong> {eventDate}
        </Text>
        <Text style={detailsText}>
          <strong>Inscrits :</strong> {confirmedCount}
          {capacity ? ` / ${capacity}` : ""} confirmés
          {waitlistCount > 0 && ` + ${waitlistCount} en attente`}
        </Text>
      </Section>

      <Section style={buttonSection}>
        <Button style={buttonSecondary} href={dashboardUrl}>
          Gérer les inscriptions
        </Button>
      </Section>
    </BaseTemplate>
  );
}

export default NewRegistrationOrganizerEmail;
