import {
  Body,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Img,
  Preview,
  Section,
  Text,
} from "@react-email/components";
import * as React from "react";

interface BaseTemplateProps {
  previewText: string;
  heading: string;
  children: React.ReactNode;
}

export function BaseTemplate({ previewText, heading, children }: BaseTemplateProps) {
  return (
    <Html>
      <Head />
      <Preview>{previewText}</Preview>
      <Body style={main}>
        <Container style={container}>
          {/* Header with logo */}
          <Section style={header}>
            <Img
              src="https://eventlite.context-collective.org/logo.png"
              width="40"
              height="40"
              alt="EventLite"
              style={logo}
            />
            <Text style={logoText}>EventLite</Text>
          </Section>

          <Heading style={headingStyle}>{heading}</Heading>

          {children}

          <Hr style={hr} />

          <Section style={footerSection}>
            <Text style={footer}>
              Cet email a été envoyé automatiquement par EventLite.
            </Text>
            <Text style={footerSmall}>
              EventLite - Gestion d'événements simplifiée
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

// ============================================
// SHARED STYLES (exportés pour réutilisation)
// ============================================

export const main = {
  backgroundColor: "#f6f9fc",
  fontFamily:
    '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Ubuntu, sans-serif',
};

export const container = {
  backgroundColor: "#ffffff",
  margin: "0 auto",
  padding: "0",
  borderRadius: "12px",
  maxWidth: "600px",
  border: "1px solid #e5e7eb",
};

export const header = {
  backgroundColor: "#f8fafc",
  padding: "20px",
  borderTopLeftRadius: "12px",
  borderTopRightRadius: "12px",
  borderBottom: "1px solid #e5e7eb",
  textAlign: "center" as const,
};

export const logo = {
  display: "inline-block",
  verticalAlign: "middle",
};

export const logoText = {
  display: "inline-block",
  verticalAlign: "middle",
  fontSize: "20px",
  fontWeight: "bold" as const,
  color: "#1a1a1a",
  margin: "0 0 0 10px",
};

export const headingStyle = {
  fontSize: "24px",
  fontWeight: "bold" as const,
  textAlign: "center" as const,
  margin: "30px 20px 20px",
  color: "#1a1a1a",
};

export const paragraph = {
  fontSize: "16px",
  lineHeight: "26px",
  color: "#525252",
  margin: "0 0 16px",
  padding: "0 20px",
};

export const detailsSection = {
  backgroundColor: "#f9fafb",
  borderRadius: "8px",
  padding: "20px",
  margin: "20px",
};

export const detailsTitle = {
  fontSize: "12px",
  fontWeight: "600" as const,
  color: "#6b7280",
  margin: "0 0 12px",
  textTransform: "uppercase" as const,
  letterSpacing: "0.5px",
};

export const detailsText = {
  fontSize: "14px",
  lineHeight: "24px",
  color: "#525252",
  margin: "0 0 8px",
};

export const detailsHighlight = {
  fontSize: "18px",
  fontWeight: "600" as const,
  color: "#1a1a1a",
  margin: "0 0 12px",
};

export const buttonSection = {
  textAlign: "center" as const,
  margin: "30px 20px",
};

export const buttonPrimary = {
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

export const buttonSecondary = {
  backgroundColor: "#0f172a",
  borderRadius: "6px",
  color: "#fff",
  fontSize: "16px",
  fontWeight: "600" as const,
  textDecoration: "none",
  textAlign: "center" as const,
  padding: "12px 24px",
  display: "inline-block",
};

export const buttonOutline = {
  backgroundColor: "#ffffff",
  border: "2px solid #e5e7eb",
  borderRadius: "6px",
  color: "#525252",
  fontSize: "14px",
  fontWeight: "500" as const,
  textDecoration: "none",
  textAlign: "center" as const,
  padding: "10px 20px",
  display: "inline-block",
};

export const hr = {
  borderColor: "#e5e7eb",
  margin: "30px 20px",
};

export const footerSection = {
  padding: "0 20px 30px",
};

export const footer = {
  fontSize: "14px",
  lineHeight: "22px",
  color: "#6b7280",
  margin: "0 0 8px",
  textAlign: "center" as const,
};

export const footerSmall = {
  fontSize: "12px",
  lineHeight: "20px",
  color: "#9ca3af",
  margin: "0",
  textAlign: "center" as const,
};

export const link = {
  color: "#10b981",
  textDecoration: "underline",
};

export const alertBox = {
  backgroundColor: "#fef3c7",
  border: "1px solid #f59e0b",
  borderRadius: "8px",
  padding: "16px",
  margin: "20px",
};

export const alertBoxSuccess = {
  backgroundColor: "#d1fae5",
  border: "1px solid #10b981",
  borderRadius: "8px",
  padding: "16px",
  margin: "20px",
};

export const alertText = {
  fontSize: "14px",
  color: "#92400e",
  margin: "0",
};

export const alertTextSuccess = {
  fontSize: "14px",
  color: "#065f46",
  margin: "0",
};
