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

interface ConfirmationEmailProps {
  firstName: string;
  eventTitle: string;
  eventDate: string;
  eventLocation?: string;
  isOnline: boolean;
  cancelUrl: string;
  eventUrl: string;
  isWaitlist?: boolean;
}

export function ConfirmationEmail({
  firstName,
  eventTitle,
  eventDate,
  eventLocation,
  isOnline,
  cancelUrl,
  eventUrl,
  isWaitlist = false,
}: ConfirmationEmailProps) {
  const previewText = isWaitlist
    ? `Vous êtes sur la liste d'attente pour ${eventTitle}`
    : `Votre inscription à ${eventTitle} est confirmée`;

  return (
    <Html>
      <Head />
      <Preview>{previewText}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={heading}>
            {isWaitlist
              ? "Vous êtes sur la liste d'attente"
              : "Inscription confirmée !"}
          </Heading>

          <Text style={paragraph}>Bonjour {firstName},</Text>

          {isWaitlist ? (
            <Text style={paragraph}>
              Votre demande d'inscription pour <strong>{eventTitle}</strong> a
              bien été enregistrée. L'événement étant complet, vous avez été
              ajouté(e) à la liste d'attente.
            </Text>
          ) : (
            <Text style={paragraph}>
              Votre inscription pour <strong>{eventTitle}</strong> a bien été
              confirmée. Nous avons hâte de vous y voir !
            </Text>
          )}

          <Section style={detailsSection}>
            <Text style={detailsTitle}>Détails de l'événement</Text>
            <Text style={detailsText}>
              <strong>Événement :</strong> {eventTitle}
            </Text>
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
            <Button style={button} href={eventUrl}>
              Voir l'événement
            </Button>
          </Section>

          {isWaitlist && (
            <Text style={paragraph}>
              Nous vous contacterons par email si une place se libère.
            </Text>
          )}

          <Hr style={hr} />

          <Text style={footer}>
            Si vous ne pouvez plus participer, vous pouvez{" "}
            <Link href={cancelUrl} style={link}>
              annuler votre inscription
            </Link>
            .
          </Text>

          <Text style={footer}>
            Cet email a été envoyé automatiquement par EventLite.
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

export default ConfirmationEmail;

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
