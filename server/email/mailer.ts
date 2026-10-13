import "server-only";
import { getConfig } from "@/server/config";

/**
 * Outgoing email (password reset, optional verification; ADR-011).
 *
 * - With RESEND_API_KEY and EMAIL_FROM: sends through Resend's HTTP API.
 * - Development without a provider: prints the link to the server console so
 *   the flow can be exercised locally. Nothing is sent.
 * - Production without a provider: throws. The UI checks availability first
 *   and tells the user that reset is unavailable instead of pretending.
 *
 * Email bodies contain only the link, never thought content.
 */
export class EmailNotConfiguredError extends Error {}

export interface OutgoingEmail {
  to: string;
  subject: string;
  text: string;
}

export async function sendEmail(message: OutgoingEmail): Promise<void> {
  const config = getConfig();
  if (!config.email) {
    if (config.isProduction) throw new EmailNotConfiguredError("No email provider is configured");
    console.info(`[email:dev] To: ${message.to}\n[email:dev] Subject: ${message.subject}\n[email:dev] ${message.text}`);
    return;
  }

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { authorization: `Bearer ${config.email.apiKey}`, "content-type": "application/json" },
    body: JSON.stringify({ from: config.email.from, to: [message.to], subject: message.subject, text: message.text }),
  });
  if (!res.ok) {
    // Log the status only; the response may echo the address.
    throw new Error(`Email provider returned ${res.status}`);
  }
}
