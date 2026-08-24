/**
 * Turns a booking into a Google Calendar event payload.
 *
 * Guest email is the address the patient typed (normalised like Gmail:
 * trimmed, lowercased). Their legal name is the attendee displayName and
 * also the start of the event title so the invite in Gmail reads as
 * "Name — Service" rather than a bare clinic calendar block.
 */
import {
  emailError,
  formatPatientName,
  getLocationName,
} from "@/lib/booking/schema";
import type { BookingRecord } from "@/lib/booking/records";
import { getServiceBySlug } from "@/lib/services/catalog";
import { formatDuration } from "@/lib/services/format";
import { CalendarInviteError, insertCalendarEvent } from "./google";

const CLINIC_TZ = "Asia/Manila";

function pad(value: number): string {
  return value.toString().padStart(2, "0");
}

/** Adds chair time onto a Manila wall-clock date/time without shifting timezone. */
export function addClinicMinutes(
  date: string,
  time: string,
  minutes: number,
): { date: string; time: string } {
  const [year, month, day] = date.split("-").map(Number);
  const [hour, minute] = time.split(":").map(Number);
  const start = Date.UTC(year, month - 1, day, hour, minute);
  const end = new Date(start + minutes * 60_000);
  return {
    date: `${end.getUTCFullYear()}-${pad(end.getUTCMonth() + 1)}-${pad(end.getUTCDate())}`,
    time: `${pad(end.getUTCHours())}:${pad(end.getUTCMinutes())}`,
  };
}

/** Requires a real contact email; messenger bookings without one cannot be approved. */
export function gmailInviteAddress(raw: string | null | undefined): string {
  const email = raw?.trim().toLowerCase() ?? "";
  if (emailError(email, true)) {
    throw new CalendarInviteError(
      "This request has no valid email, so a Gmail calendar invite cannot be sent. The booking was left pending.",
      400,
    );
  }
  return email;
}

/** Uses the catalog's longer published duration (e.g. 60 mins for 45–1 hr cleaning). */
function chairMinutes(slug: string): number {
  const service = getServiceBySlug(slug);
  return service?.duration.maxMinutes ?? 60;
}

/** Event body sent to events.insert: title, branch as location, guest with name. */
export function buildCalendarEvent(record: BookingRecord) {
  const { appointment } = record;
  const patientName = formatPatientName(appointment);
  const service = getServiceBySlug(appointment.serviceSlug);
  const serviceName = service?.name ?? appointment.serviceSlug;
  const duration = service?.duration ?? {
    minMinutes: 60,
    maxMinutes: 60,
    visits: 1,
  };
  const minutes = chairMinutes(appointment.serviceSlug);
  const branch =
    getLocationName(appointment.locationId) ?? appointment.locationId;
  const email = gmailInviteAddress(appointment.email);
  const end = addClinicMinutes(
    appointment.preferredDate,
    appointment.preferredTime,
    minutes,
  );

  return {
    summary: `${patientName} — ${serviceName}`,
    description: [
      "Urban Smiles appointment",
      `Patient: ${patientName}`,
      `Service: ${serviceName} (${formatDuration(duration)})`,
      `Branch: ${branch}`,
      `Reference: ${record.reference}`,
      `Mobile: ${appointment.phone}`,
      ...(appointment.notes ? [`Notes: ${appointment.notes}`] : []),
      "Please RSVP on this Google Calendar invite in Gmail so the clinic knows you received it.",
    ].join("\n"),
    location: branch,
    start: {
      dateTime: `${appointment.preferredDate}T${appointment.preferredTime}:00`,
      timeZone: CLINIC_TZ,
    },
    end: {
      dateTime: `${end.date}T${end.time}:00`,
      timeZone: CLINIC_TZ,
    },
    attendees: [
      {
        email,
        displayName: patientName,
        responseStatus: "needsAction" as const,
      },
    ],
    guestsCanModify: false,
    guestsCanInviteOthers: false,
    reminders: { useDefault: true },
  };
}

/** Creates the clinic calendar event and returns Google's event id. */
export async function sendBookingInvite(
  record: BookingRecord,
): Promise<string> {
  return insertCalendarEvent(buildCalendarEvent(record));
}
