/**
 * Google Calendar API adapter used when a booking is approved.
 *
 * Flow: service account JWT → events.insert (with sendUpdates) → event id.
 * Gmail guests only receive the invite if GOOGLE_CALENDAR_IMPERSONATE is a
 * Workspace user with domain-wide delegation; a bare service account can
 * write the clinic calendar but often cannot email attendees.
 */
import { google, type calendar_v3 } from "googleapis";

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

/** Clinic calendar the service account must already be able to write. */
export function googleCalendarId(): string | undefined {
  return process.env.GOOGLE_CALENDAR_ID?.trim() || undefined;
}

/** True when both a service account and GOOGLE_CALENDAR_ID are present. */
export function calendarConfigured(): boolean {
  return Boolean(serviceAccount() && googleCalendarId());
}

/**
 * Builds a Calendar API client. `subject` impersonates the clinic Gmail so
 * guest invites actually land in the patient's inbox.
 */
function calendarClient(): {
  calendar: calendar_v3.Calendar;
  calendarId: string;
} {
  const account = serviceAccount();
  const calendarId = googleCalendarId();
  if (!account || !calendarId) {
    throw new CalendarInviteError(
      "Google Calendar is not configured. Set GOOGLE_CALENDAR_ID and the service account before approving.",
      503,
    );
  }

  const auth = new google.auth.JWT({
    email: account.client_email,
    key: account.private_key,
    scopes: ["https://www.googleapis.com/auth/calendar"],
    subject: process.env.GOOGLE_CALENDAR_IMPERSONATE?.trim() || undefined,
  });

  return {
    calendar: google.calendar({ version: "v3", auth }),
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
        `Could not send the Google Calendar invite: ${googleMessage(error)}`,
        502,
      );
    }
    await new Promise((resolve) => setTimeout(resolve, 400));
    try {
      return await run();
    } catch (retryError) {
      throw new CalendarInviteError(
        `Could not send the Google Calendar invite after retry: ${googleMessage(retryError)}`,
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
