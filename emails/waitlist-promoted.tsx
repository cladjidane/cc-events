import { Button, Section, Text } from "@react-email/components";
import {
  BaseTemplate,
  paragraph,
  detailsSection,
  detailsTitle,
  detailsText,
  detailsHighlight,
  buttonSection,
  buttonPrimary,
  alertBoxSuccess,
  alertTextSuccess,
  link,
} from "./base-template";

interface WaitlistPromotedEmailProps {
  firstName: string;
  eventTitle: string;
  eventDate: string;
  eventLocation?: string;
  isOnline: boolean;
  eventUrl: string;
  cancelUrl: string;
}

export function WaitlistPromotedEmail({
  firstName,
  eventTitle,
  eventDate,
  eventLocation,
  isOnline,
  eventUrl,
  cancelUrl,
}: WaitlistPromotedEmailProps) {
  const previewText = `Bonne nouvelle ! Une place s'est libérée pour ${eventTitle}`;

  return (
    <BaseTemplate previewText={previewText} heading="Une place s'est libérée !">
      <Text style={paragraph}>Bonjour {firstName},</Text>

      <Section style={alertBoxSuccess}>
        <Text style={alertTextSuccess}>
          Bonne nouvelle ! Une place s'est libérée et votre inscription à{" "}
          <strong>{eventTitle}</strong> est maintenant <strong>confirmée</strong>
          .
        </Text>
      </Section>

      <Text style={paragraph}>
        Vous étiez sur la liste d'attente et une personne a annulé son
        inscription. Vous êtes maintenant officiellement inscrit(e) à
        l'événement.
      </Text>

      <Section style={detailsSection}>
        <Text style={detailsTitle}>Détails de l'événement</Text>
        <Text style={detailsHighlight}>{eventTitle}</Text>
        <Text style={detailsText}>
          <strong>Date :</strong> {eventDate}
        </Text>
        {eventLocation && (
          <Text style={detailsText}>
            <strong>{isOnline ? "Lien" : "Lieu"} :</strong> {eventLocation}
          </Text>
        )}
      </Section>

      <Section style={buttonSection}>
        <Button style={buttonPrimary} href={eventUrl}>
          Voir l'événement
        </Button>
      </Section>

      <Text style={{ ...paragraph, fontSize: "14px", color: "#6b7280" }}>
        Si vous ne pouvez plus participer, merci d'
        <a href={cancelUrl} style={link}>
          annuler votre inscription
        </a>{" "}
        pour libérer votre place.
      </Text>
    </BaseTemplate>
  );
}

export default WaitlistPromotedEmail;
