import { Button, Section, Text } from "@react-email/components";
import {
  BaseTemplate,
  paragraph,
  detailsSection,
  detailsTitle,
  detailsText,
  detailsHighlight,
  buttonSection,
  buttonOutline,
} from "./base-template";

interface CancellationConfirmationEmailProps {
  firstName: string;
  eventTitle: string;
  eventDate: string;
  eventUrl: string;
}

export function CancellationConfirmationEmail({
  firstName,
  eventTitle,
  eventDate,
  eventUrl,
}: CancellationConfirmationEmailProps) {
  const previewText = `Votre inscription à ${eventTitle} a été annulée`;

  return (
    <BaseTemplate previewText={previewText} heading="Inscription annulée">
      <Text style={paragraph}>Bonjour {firstName},</Text>

      <Text style={paragraph}>
        Votre inscription à <strong>{eventTitle}</strong> a bien été annulée.
      </Text>

      <Section style={detailsSection}>
        <Text style={detailsTitle}>Événement concerné</Text>
        <Text style={detailsHighlight}>{eventTitle}</Text>
        <Text style={detailsText}>
          <strong>Date :</strong> {eventDate}
        </Text>
        <Text style={detailsText}>
          <strong>Statut :</strong> Inscription annulée
        </Text>
      </Section>

      <Text style={paragraph}>
        Si vous changez d'avis, vous pouvez toujours vous réinscrire tant que
        des places sont disponibles.
      </Text>

      <Section style={buttonSection}>
        <Button style={buttonOutline} href={eventUrl}>
          Voir l'événement
        </Button>
      </Section>

      <Text style={{ ...paragraph, fontSize: "14px", color: "#6b7280" }}>
        Nous espérons vous revoir lors d'un prochain événement !
      </Text>
    </BaseTemplate>
  );
}

export default CancellationConfirmationEmail;
