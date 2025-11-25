import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Preview,
  Section,
  Text,
} from "@react-email/components";

interface EventApprovalEmailProps {
  eventTitle: string;
  eventDate: string;
  eventLocation?: string;
  eventDescription?: string;
  isOnline: boolean;
  capacity?: number;
  approvePublishUrl: string;
  approveDraftUrl: string;
  rejectUrl: string;
}

export function EventApprovalEmail({
  eventTitle,
  eventDate,
  eventLocation,
  eventDescription,
  isOnline,
  capacity,
  approvePublishUrl,
  approveDraftUrl,
  rejectUrl,
}: EventApprovalEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>Validez votre événement : {eventTitle}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={heading}>Nouvel événement à valider</Heading>

          <Text style={paragraph}>
            Un événement a été créé via l'assistant IA et attend votre validation.
          </Text>

          <Section style={detailsSection}>
            <Text style={detailsTitle}>Détails de l'événement</Text>
            <Text style={eventTitleStyle}>{eventTitle}</Text>
            <Text style={detailsText}>
              <strong>Date :</strong> {eventDate}
            </Text>
            <Text style={detailsText}>
              <strong>Mode :</strong> {isOnline ? "En ligne" : "Présentiel"}
            </Text>
            {eventLocation && (
              <Text style={detailsText}>
                <strong>{isOnline ? "Lien" : "Lieu"} :</strong> {eventLocation}
              </Text>
            )}
            {capacity && (
              <Text style={detailsText}>
                <strong>Capacité :</strong> {capacity} personnes
              </Text>
            )}
            {eventDescription && (
              <>
                <Hr style={hrSmall} />
                <Text style={descriptionText}>{eventDescription}</Text>
              </>
            )}
          </Section>

          <Section style={buttonSection}>
            <Button style={buttonPrimary} href={approvePublishUrl}>
              Publier l'événement
            </Button>
          </Section>

          <Section style={buttonSection}>
            <Button style={buttonSecondary} href={approveDraftUrl}>
              Enregistrer en brouillon
            </Button>
          </Section>

          <Hr style={hr} />

          <Text style={footer}>
            Si vous n'êtes pas à l'origine de cette demande, vous pouvez{" "}
            <a href={rejectUrl} style={link}>
              refuser et supprimer
            </a>{" "}
            cet événement.
          </Text>

          <Text style={footerSmall}>
            Ce lien expire dans 24 heures. Passé ce délai, l'événement sera automatiquement supprimé.
          </Text>

          <Text style={footerSmall}>
            Cet email a été envoyé automatiquement par EventLite.
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

export default EventApprovalEmail;

const main = {
  backgroundColor: "#f6f9fc",
  fontFamily:
    '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Ubuntu, sans-serif',
};

const container = {
  backgroundColor: "#ffffff",
  margin: "0 auto",
  padding: "40px 20px",
  borderRadius: "8px",
  maxWidth: "600px",
};

const heading = {
  fontSize: "24px",
  fontWeight: "bold" as const,
  textAlign: "center" as const,
  margin: "0 0 30px",
  color: "#1a1a1a",
};

const paragraph = {
  fontSize: "16px",
  lineHeight: "26px",
  color: "#525252",
  margin: "0 0 20px",
};

const detailsSection = {
  backgroundColor: "#f9fafb",
  borderRadius: "8px",
  padding: "20px",
  margin: "20px 0",
};

const detailsTitle = {
  fontSize: "12px",
  fontWeight: "600" as const,
  color: "#6b7280",
  margin: "0 0 8px",
  textTransform: "uppercase" as const,
  letterSpacing: "0.5px",
};

const eventTitleStyle = {
  fontSize: "20px",
  fontWeight: "bold" as const,
  color: "#1a1a1a",
  margin: "0 0 16px",
};

const detailsText = {
  fontSize: "14px",
  lineHeight: "24px",
  color: "#525252",
  margin: "0 0 8px",
};

const descriptionText = {
  fontSize: "14px",
  lineHeight: "22px",
  color: "#6b7280",
  margin: "12px 0 0",
  fontStyle: "italic" as const,
};

const buttonSection = {
  textAlign: "center" as const,
  margin: "16px 0",
};

const buttonPrimary = {
  backgroundColor: "#10b981",
  borderRadius: "6px",
  color: "#fff",
  fontSize: "16px",
  fontWeight: "600" as const,
  textDecoration: "none",
  textAlign: "center" as const,
  padding: "12px 24px",
  display: "inline-block",
};

const buttonSecondary = {
  backgroundColor: "#6b7280",
  borderRadius: "6px",
  color: "#fff",
  fontSize: "14px",
  fontWeight: "500" as const,
  textDecoration: "none",
  textAlign: "center" as const,
  padding: "10px 20px",
  display: "inline-block",
};

const hr = {
  borderColor: "#e5e7eb",
  margin: "30px 0",
};

const hrSmall = {
  borderColor: "#e5e7eb",
  margin: "12px 0",
};

const footer = {
  fontSize: "14px",
  lineHeight: "22px",
  color: "#6b7280",
  margin: "0 0 10px",
};

const footerSmall = {
  fontSize: "12px",
  lineHeight: "20px",
  color: "#9ca3af",
  margin: "0 0 8px",
};

const link = {
  color: "#dc2626",
  textDecoration: "underline",
};
