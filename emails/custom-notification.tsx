import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Link,
  Preview,
  Section,
  Text,
} from "@react-email/components";

interface CustomNotificationEmailProps {
  firstName: string;
  subject: string;
  message: string;
  eventTitle?: string;
  eventDate?: string;
  eventLocation?: string;
  isOnline?: boolean;
  eventUrl?: string;
  cancelUrl?: string;
  includeEventDetails?: boolean;
}

export function CustomNotificationEmail({
  firstName,
  subject,
  message,
  eventTitle,
  eventDate,
  eventLocation,
  isOnline,
  eventUrl,
  cancelUrl,
  includeEventDetails = true,
}: CustomNotificationEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>{subject}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={heading}>{subject}</Heading>

          <Text style={paragraph}>Bonjour {firstName},</Text>

          {/* Message personnalisé - préserve les sauts de ligne */}
          {message.split("\n").map((line, index) => (
            <Text key={index} style={paragraph}>
              {line || "\u00A0"}
            </Text>
          ))}

          {/* Détails de l'événement (optionnel) */}
          {includeEventDetails && eventTitle && (
            <Section style={detailsSection}>
              <Text style={detailsTitle}>Détails de l'événement</Text>
              <Text style={detailsText}>
                <strong>Événement :</strong> {eventTitle}
              </Text>
              {eventDate && (
                <Text style={detailsText}>
                  <strong>Date :</strong> {eventDate}
                </Text>
              )}
              {eventLocation && (
                <Text style={detailsText}>
                  <strong>{isOnline ? "Lien" : "Lieu"} :</strong> {eventLocation}
                </Text>
              )}
            </Section>
          )}

          {/* Bouton vers l'événement */}
          {eventUrl && (
            <Section style={buttonSection}>
              <Button style={button} href={eventUrl}>
                Voir l'événement
              </Button>
            </Section>
          )}

          <Hr style={hr} />

          {/* Lien d'annulation */}
          {cancelUrl && (
            <Text style={footer}>
              Si vous ne pouvez plus participer, vous pouvez{" "}
              <Link href={cancelUrl} style={link}>
                annuler votre inscription
              </Link>
              .
            </Text>
          )}

          <Text style={footer}>
            Cet email a été envoyé automatiquement par EventLite.
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

export default CustomNotificationEmail;

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
  margin: "0 0 10px",
};

const detailsSection = {
  backgroundColor: "#f9fafb",
  borderRadius: "8px",
  padding: "20px",
  margin: "20px 0",
};

const detailsTitle = {
  fontSize: "14px",
  fontWeight: "600" as const,
  color: "#1a1a1a",
  margin: "0 0 12px",
  textTransform: "uppercase" as const,
  letterSpacing: "0.5px",
};

const detailsText = {
  fontSize: "14px",
  lineHeight: "24px",
  color: "#525252",
  margin: "0 0 8px",
};

const buttonSection = {
  textAlign: "center" as const,
  margin: "30px 0",
};

const button = {
  backgroundColor: "#0f172a",
  borderRadius: "6px",
  color: "#fff",
  fontSize: "16px",
  fontWeight: "600" as const,
  textDecoration: "none",
  textAlign: "center" as const,
  padding: "12px 24px",
};

const hr = {
  borderColor: "#e5e7eb",
  margin: "30px 0",
};

const footer = {
  fontSize: "14px",
  lineHeight: "22px",
  color: "#6b7280",
  margin: "0 0 10px",
};

const link = {
  color: "#2563eb",
  textDecoration: "underline",
};
