/**
 * Sends clinic mail as the Gmail that already owns the booking calendar.
 *
 * Resend cannot use @gmail.com as From, and its sandbox only delivers to the
 * account owner. Gmail API `users.messages.send` as that mailbox can reach any
 * patient address. Requires gmail.send on the same refresh token as Calendar.
 */
import { google } from "googleapis";
import { clinicOAuthClient } from "@/lib/google/oauth";
import { RejectEmailError } from "./errors";

function fromMailbox(): string | undefined {
  return (
    process.env.GOOGLE_MAIL_FROM?.trim() ||
    process.env.GOOGLE_CALENDAR_ID?.trim() ||
    undefined
  );
}

export function clinicMailConfigured(): boolean {
  return Boolean(clinicOAuthClient() && fromMailbox());
}

function googleMessage(error: unknown): string {
  if (!error || typeof error !== "object") return "Unknown Gmail error.";
  const withResponse = error as {
    message?: string;
    response?: { data?: { error?: { message?: string } } };
  };
  return (
    withResponse.response?.data?.error?.message ??
    withResponse.message ??
    "Unknown Gmail error."
  );
}

function withMailHint(message: string): string {
  const lower = message.toLowerCase();
  if (
    lower.includes("insufficient") ||
    lower.includes("insufficientpermissions") ||
    lower.includes("access not granted")
  ) {
    return `${message} Re-run \`npm run calendar:auth\` as the clinic Gmail so the token includes gmail.send.`;
  }
  if (
    lower.includes("gmail api has not been used") ||
    lower.includes("disabled")
  ) {
    return `${message} Enable the Gmail API on the same Google Cloud project as the OAuth client.`;
  }
  return message;
}

function encodeSubject(subject: string): string {
  return `=?UTF-8?B?${Buffer.from(subject, "utf8").toString("base64")}?=`;
}

function rfc2822(input: {
  from: string;
  to: string;
  subject: string;
  html: string;
  text: string;
}): string {
  const boundary = `us_${crypto.randomUUID().replaceAll("-", "")}`;
  return [
    `From: Urban Smiles <${input.from}>`,
    `To: ${input.to}`,
    `Subject: ${encodeSubject(input.subject)}`,
    "MIME-Version: 1.0",
    `Content-Type: multipart/alternative; boundary="${boundary}"`,
    "",
    `--${boundary}`,
    "Content-Type: text/plain; charset=UTF-8",
    "Content-Transfer-Encoding: base64",
    "",
    Buffer.from(input.text, "utf8").toString("base64"),
    `--${boundary}`,
    "Content-Type: text/html; charset=UTF-8",
    "Content-Transfer-Encoding: base64",
    "",
    Buffer.from(input.html, "utf8").toString("base64"),
    `--${boundary}--`,
  ].join("\r\n");
}

export async function sendClinicEmail(input: {
  to: string;
  subject: string;
  html: string;
  text: string;
}): Promise<void> {
  const auth = clinicOAuthClient();
  const from = fromMailbox();
  if (!auth || !from) {
    throw new RejectEmailError(
      "Clinic mail is not configured. Run `npm run calendar:auth` and set GOOGLE_OAUTH_* plus GOOGLE_CALENDAR_ID before rejecting.",
      503,
    );
  }

  const gmail = google.gmail({ version: "v1", auth });
  const raw = Buffer.from(
    rfc2822({
      from,
      to: input.to,
      subject: input.subject,
      html: input.html,
      text: input.text,
    }),
    "utf8",
  ).toString("base64url");

  try {
    await gmail.users.messages.send({
      userId: "me",
      requestBody: { raw },
    });
  } catch (error) {
    throw new RejectEmailError(
      `Could not email the patient: ${withMailHint(googleMessage(error))}`,
      502,
    );
  }
}
