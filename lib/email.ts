import nodemailer from "nodemailer";
import { render } from "@react-email/components";
import { Resend } from "resend";

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

// Resend (fallback si SMTP absent mais RESEND_API_KEY présent)
const resendApiKey = process.env.RESEND_API_KEY;
const resend = resendApiKey ? new Resend(resendApiKey) : null;

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
  // Aucun transport configuré → bloquant (sauf en test pour ne pas casser les suites)
  if (!transporter && !resend) {
    const message =
      "Email transport not configured. Set SMTP_HOST/SMTP_USER/SMTP_PASSWORD (or RESEND_API_KEY) and SMTP_FROM/SMTP_FROM_NAME.";
    if (process.env.NODE_ENV === "test") {
      console.warn(message);
      return { success: false, error: new Error(message) };
    }
    throw new Error(message);
  }

  try {
    // Convertir le composant React en HTML
    const html = await render(react);

    if (resend) {
      const { data, error } = await resend.emails.send({
        from: `${fromName} <${fromEmail}>`,
        to,
        subject,
        html,
      });
      if (error) {
        console.error("[EMAIL] Resend error:", error);
        // Si SMTP est dispo, tenter en fallback
        if (transporter) {
          console.warn("[EMAIL] Falling back to SMTP after Resend failure");
        } else {
          return { success: false, error };
        }
      } else {
        console.log(`[EMAIL] Sent via Resend to ${to}: ${data?.id}`);
        return { success: true, data: { id: data?.id || "resend" } };
      }
    }

    if (transporter) {
      const info = await transporter.sendMail({
        from: `${fromName} <${fromEmail}>`,
        to,
        subject,
        html,
      });

      console.log(`[EMAIL] Sent via SMTP to ${to}: ${info.messageId}`);
      return { success: true, data: { id: info.messageId } };
    }

    return { success: false, error: new Error("No email transport available") };
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
