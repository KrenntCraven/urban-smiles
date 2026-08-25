/**
 * Resend adapter for clinic mail. Server only — the API key never reaches
 * the browser. Reject emails send before the booking is marked rejected.
 */
import { Resend } from "resend";

export class RejectEmailError extends Error {
  constructor(
    message: string,
    readonly status = 502,
  ) {
    super(message);
    this.name = "RejectEmailError";
  }
}

function resendClient(): Resend | undefined {
  const key = process.env.RESEND_API_KEY?.trim();
  if (!key) return undefined;
  return new Resend(key);
}

function fromAddress(): string | undefined {
  return process.env.RESEND_FROM?.trim() || undefined;
}

export function rejectEmailConfigured(): boolean {
  return Boolean(resendClient() && fromAddress());
}

export async function sendResendEmail(input: {
  to: string;
  subject: string;
  html: string;
  text: string;
}): Promise<void> {
  const resend = resendClient();
  const from = fromAddress();
  if (!resend || !from) {
    throw new RejectEmailError(
      "Resend is not configured. Set RESEND_API_KEY and RESEND_FROM before rejecting.",
      503,
    );
  }

  const { error } = await resend.emails.send({
    from,
    to: input.to,
    subject: input.subject,
    html: input.html,
    text: input.text,
  });

  if (error) {
    throw new RejectEmailError(
      `Could not email the patient: ${error.message}`,
      502,
    );
  }
}
