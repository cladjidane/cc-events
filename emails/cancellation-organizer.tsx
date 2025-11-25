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
  alertBox,
  alertText,
} from "./base-template";

interface CancellationOrganizerEmailProps {
  organizerName: string;
  participantName: string;
  participantEmail: string;
  eventTitle: string;
  eventDate: string;
  confirmedCount: number;
  capacity?: number | null;
  waitlistCount: number;
  promotedParticipant?: {
    name: string;
    email: string;
  };
  dashboardUrl: string;
}

export function CancellationOrganizerEmail({
  organizerName,
  participantName,
  participantEmail,
  eventTitle,
  eventDate,
  confirmedCount,
  capacity,
  waitlistCount,
  promotedParticipant,
  dashboardUrl,
}: CancellationOrganizerEmailProps) {
  const previewText = `Annulation : ${participantName} - ${eventTitle}`;

  return (
    <BaseTemplate previewText={previewText} heading="Inscription annulée">
      <Text style={paragraph}>Bonjour {organizerName},</Text>

      <Text style={paragraph}>
        <strong>{participantName}</strong> a annulé son inscription à votre
        événement.
      </Text>

      {promotedParticipant && (
        <Section style={alertBox}>
          <Text style={alertText}>
            <strong>{promotedParticipant.name}</strong> (
            {promotedParticipant.email}) a été automatiquement promu(e) depuis
            la liste d'attente.
          </Text>
        </Section>
      )}

      <Section style={detailsSection}>
        <Text style={detailsTitle}>Participant ayant annulé</Text>
        <Text style={detailsHighlight}>{participantName}</Text>
        <Text style={detailsText}>
          <strong>Email :</strong> {participantEmail}
        </Text>
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

export default CancellationOrganizerEmail;
