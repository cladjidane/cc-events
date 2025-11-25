import nodemailer from "nodemailer";
import { render } from "@react-email/components";

// Configuration SMTP (prioritaire)
const smtpConfig = {
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || "587"),
  secure: process.env.SMTP_SECURE === "true", // true pour 465, false pour autres ports
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  },
};

// Créer le transporter SMTP si configuré
const transporter =
  smtpConfig.host && smtpConfig.auth.user
    ? nodemailer.createTransport(smtpConfig)
    : null;

// Email expéditeur
const fromEmail = process.env.SMTP_FROM || "contact@context-collective.org";
const fromName = process.env.SMTP_FROM_NAME || "EventLite";

export async function sendEmail({
  to,
  subject,
  react,
}: {
  to: string;
  subject: string;
  react: React.ReactElement;
}) {
  // Si pas de transporter SMTP configuré, logger et retourner
  if (!transporter) {
    console.log(`[EMAIL MOCK] To: ${to}, Subject: ${subject}`);
    console.log("[EMAIL] SMTP not configured. Set SMTP_HOST, SMTP_USER, SMTP_PASSWORD");
    return { success: true, data: { id: "mock" } };
  }

  try {
    // Convertir le composant React en HTML
    const html = await render(react);

    // Envoyer l'email
    const info = await transporter.sendMail({
      from: `${fromName} <${fromEmail}>`,
      to,
      subject,
      html,
    });

    console.log(`[EMAIL] Sent to ${to}: ${info.messageId}`);
    return { success: true, data: { id: info.messageId } };
  } catch (error) {
    console.error("[EMAIL] Error sending email:", error);
    return { success: false, error };
  }
}

// Vérifier la connexion SMTP au démarrage (optionnel)
export async function verifySmtpConnection(): Promise<boolean> {
  if (!transporter) {
    return false;
  }

  try {
    await transporter.verify();
    console.log("[EMAIL] SMTP connection verified");
    return true;
  } catch (error) {
    console.error("[EMAIL] SMTP verification failed:", error);
    return false;
  }
}
