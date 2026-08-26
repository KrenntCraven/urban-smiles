/**
 * Google Calendar API adapter used when a booking is approved.
 *
 * Flow: auth → events.insert (with sendUpdates) → event id.
 *
 * Auth has two shapes and OAuth wins when both are present:
 *  - OAuth refresh token for the clinic Gmail. Calendar treats the call as
 *    that user, so attendees are allowed and guests are emailed. Mint the
 *    token with `npm run calendar:auth` (calendar + gmail.send).
 *  - Service account JWT. Fine for writing the calendar, but Google rejects
 *    `attendees` with "Service accounts cannot invite attendees without
 *    Domain-Wide Delegation of Authority" unless GOOGLE_CALENDAR_IMPERSONATE
 *    names a Workspace user with domain-wide delegation.
 */
import { google, type calendar_v3 } from "googleapis";
import {
  CALENDAR_SCOPE,
  clinicOAuthClient,
  oauthCredentials,
} from "@/lib/google/oauth";

/** Write access plus the ability to email guests on insert. JWT path only. */
export const CALENDAR_SCOPES = [CALENDAR_SCOPE];

/** Thrown instead of approving when Google Calendar is missing or the insert fails. */
export class CalendarInviteError extends Error {
  constructor(
    message: string,
    readonly status = 502,
    readonly retryable = false,
  ) {
    super(message);
    this.name = "CalendarInviteError";
  }
}

type ServiceAccount = {
  client_email: string;
  private_key: string;
};

/** Accepts raw JSON or base64 JSON so Vercel env values can stay on one line. */
function readJsonSecret(raw: string): unknown {
  const trimmed = raw.trim();
  if (trimmed.startsWith("{")) return JSON.parse(trimmed);
  return JSON.parse(Buffer.from(trimmed, "base64").toString("utf8"));
}

/** Reads GOOGLE_SERVICE_ACCOUNT_JSON, or email + private key as a fallback. */
function serviceAccount(): ServiceAccount | undefined {
  const json = process.env.GOOGLE_SERVICE_ACCOUNT_JSON?.trim();
  if (json) {
    const parsed = readJsonSecret(json) as ServiceAccount;
    if (parsed.client_email && parsed.private_key) {
      return {
        client_email: parsed.client_email,
        private_key: parsed.private_key.replace(/\\n/g, "\n"),
      };
    }
  }

  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL?.trim();
  const key = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n").trim();
  if (email && key) return { client_email: email, private_key: key };
  return undefined;
}

/** Clinic calendar the credentials must already be able to write. */
export function googleCalendarId(): string | undefined {
  return process.env.GOOGLE_CALENDAR_ID?.trim() || undefined;
}

/** True when GOOGLE_CALENDAR_ID plus either credential shape are present. */
export function calendarConfigured(): boolean {
  return Boolean(
    (oauthCredentials() || serviceAccount()) && googleCalendarId(),
  );
}

/**
 * Builds a Calendar API client. OAuth acts as the clinic Gmail itself, which
 * is what lets the insert carry attendees; the service account path only
 * reaches guests when `subject` impersonates a delegated Workspace user.
 */
function calendarClient(): {
  calendar: calendar_v3.Calendar;
  calendarId: string;
} {
  const calendarId = googleCalendarId();
  if (!calendarId) {
    throw new CalendarInviteError(
      "Google Calendar is not configured. Set GOOGLE_CALENDAR_ID before approving.",
      503,
    );
  }

  const auth = clinicOAuthClient();
  if (auth) {
    return {
      calendar: google.calendar({ version: "v3", auth }),
      calendarId,
    };
  }

  const account = serviceAccount();
  if (!account) {
    throw new CalendarInviteError(
      "Google Calendar has no credentials. Run `npm run calendar:auth`, or set the service account, before approving.",
      503,
    );
  }

  const jwt = new google.auth.JWT({
    email: account.client_email,
    key: account.private_key,
    scopes: CALENDAR_SCOPES,
    subject: process.env.GOOGLE_CALENDAR_IMPERSONATE?.trim() || undefined,
  });

  return {
    calendar: google.calendar({ version: "v3", auth: jwt }),
    calendarId,
  };
}

/** Prefers Google's error payload over a generic HTTP message. */
function googleMessage(error: unknown): string {
  if (!error || typeof error !== "object") return "Unknown calendar error.";
  const withResponse = error as {
    message?: string;
    response?: { data?: { error?: { message?: string } } };
  };
  return (
    withResponse.response?.data?.error?.message ??
    withResponse.message ??
    "Unknown calendar error."
  );
}

/**
 * Google's attendee refusal reads as a permissions bug, so name the fix:
 * this deployment is still on the service account, not the clinic Gmail.
 */
function withCalendarHint(message: string): string {
  if (!message.includes("Domain-Wide Delegation")) return message;
  return `${message} Run \`npm run calendar:auth\` and set GOOGLE_OAUTH_* so invites are sent as the clinic Gmail.`;
}

/** Rate limits and 5xx are worth one retry; 401/403 are configuration bugs. */
function isRetryable(error: unknown): boolean {
  const status = (error as { code?: number; response?: { status?: number } })
    .response?.status;
  const code = (error as { code?: number }).code;
  const http = status ?? code;
  return http === 429 || (typeof http === "number" && http >= 500);
}

/** Runs the Calendar call once more after a short wait when Google is busy. */
async function withRetry<T>(run: () => Promise<T>): Promise<T> {
  try {
    return await run();
  } catch (error) {
    if (!isRetryable(error)) {
      throw new CalendarInviteError(
        `Could not send the Google Calendar invite: ${withCalendarHint(googleMessage(error))}`,
        502,
      );
    }
    await new Promise((resolve) => setTimeout(resolve, 400));
    try {
      return await run();
    } catch (retryError) {
      throw new CalendarInviteError(
        `Could not send the Google Calendar invite after retry: ${withCalendarHint(googleMessage(retryError))}`,
        502,
        true,
      );
    }
  }
}

/**
 * Inserts the event and emails guests (`sendUpdates: "all"`).
 * Returns the Google event id so the booking row can store it.
 */
export async function insertCalendarEvent(
  event: calendar_v3.Schema$Event,
): Promise<string> {
  const { calendar, calendarId } = calendarClient();
  const created = await withRetry(() =>
    calendar.events.insert({
      calendarId,
      requestBody: event,
      sendUpdates: "all",
    }),
  );
  const eventId = created.data.id;
  if (!eventId) {
    throw new CalendarInviteError(
      "Google Calendar accepted the request but did not return an event id.",
    );
  }
  return eventId;
}

/**
 * Best-effort delete used when the booking could not be saved after insert.
 * Failure here is logged, not thrown — the caller already has a save error.
 */
export async function deleteCalendarEvent(eventId: string): Promise<void> {
  const { calendar, calendarId } = calendarClient();
  try {
    await calendar.events.delete({
      calendarId,
      eventId,
      sendUpdates: "all",
    });
  } catch (error) {
    console.error("Could not roll back the calendar event", eventId, error);
  }
}
