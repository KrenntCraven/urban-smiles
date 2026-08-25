/**
 * Turns a booking into a Google Calendar event payload.
 *
 * The invite is a clinic appointment, not a patient record: title, time,
 * branch, and address only. Phone, notes, name, and the booking reference
 * stay in admin. The guest list still uses the patient's email so Gmail can
 * deliver the invite; displayName is omitted so that name is not copied into
 * Google's event body.
 */
import {
  emailError,
  getLocationAddress,
  getLocationName,
  getLocationShortName,
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

/** Google renders a small HTML subset here; anything else must be escaped. */
function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function detailRow(label: string, value: string): string {
  return `<b>${label}:</b> ${escapeHtml(value)}`;
}

/** Event body sent to events.insert: clinic title, branch location, guest email. */
export function buildCalendarEvent(record: BookingRecord) {
  const { appointment } = record;
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
  const branchShort = getLocationShortName(appointment.locationId) ?? branch;
  const address = getLocationAddress(appointment.locationId);
  const email = gmailInviteAddress(appointment.email);
  const end = addClinicMinutes(
    appointment.preferredDate,
    appointment.preferredTime,
    minutes,
  );

  return {
    summary: `Urban Smiles ${branchShort} — ${serviceName}`,
    description: [
      `<b>Urban Smiles ${escapeHtml(branchShort)}</b><br>`,
      "Your appointment is confirmed. Please arrive 10 minutes early.<br>",
      "<br>",
      detailRow("Service", `${serviceName} (${formatDuration(duration)})`),
      "<br>",
      detailRow("Branch", branch),
      ...(address ? ["<br>", detailRow("Address", address)] : []),
      "<br><br>",
      "Reply <b>Yes</b> on this invite so the clinic knows you received it. ",
      "To reschedule or cancel, call the branch at least 24 hours ahead.",
    ].join(""),
    location: address ? `Urban Smiles ${branchShort}, ${address}` : branch,
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
