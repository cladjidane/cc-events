import { Resend } from "resend";

const resendApiKey = process.env.RESEND_API_KEY;

// Ne pas initialiser Resend si pas de clé API (dev sans email)
const resend = resendApiKey ? new Resend(resendApiKey) : null;

export async function sendEmail({
  to,
  subject,
  react,
}: {
  to: string;
  subject: string;
  react: React.ReactElement;
}) {
  // Si pas de client Resend, logger et retourner
  if (!resend) {
    console.log(`[EMAIL MOCK] To: ${to}, Subject: ${subject}`);
    return { success: true, data: { id: "mock" } };
  }

  try {
    const { data, error } = await resend.emails.send({
      from: "EventLite <noreply@eventlite.fr>",
      to,
      subject,
      react,
    });

    if (error) {
      console.error("Erreur envoi email:", error);
      return { success: false, error };
    }

    return { success: true, data };
  } catch (error) {
    console.error("Erreur envoi email:", error);
    return { success: false, error };
  }
}
