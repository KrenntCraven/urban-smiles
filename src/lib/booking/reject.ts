/**
 * Reject path shared by /admin and /staff.
 *
 * Email first, then persist "rejected". If Gmail fails the row stays pending
 * so the desk can fix the reason or the mail config and try again.
 */
import type { BookingRecord } from "./records";
import { emailError, formatPatientName } from "./schema";
import { getBooking, updateBookingStatus } from "./store";
import { RejectEmailError } from "@/lib/email/errors";
import { clinicMailConfigured, sendClinicEmail } from "@/lib/email/gmail";
import {
  rejectEmailHtml,
  rejectEmailSubject,
  rejectEmailText,
} from "@/lib/email/reject-template";

export async function rejectBookingWithNotice(
  reference: string,
  reason: string,
): Promise<BookingRecord> {
  const note = reason.trim();
  if (note.length < 3) {
    throw new RejectEmailError("Add a short reason for the patient.", 400);
  }

  const current = await getBooking(reference);
  if (!current) {
    throw new RejectEmailError("Booking not found.", 404);
  }
  if (current.status === "rejected") return current;

  if (!clinicMailConfigured()) {
    throw new RejectEmailError(
      "Clinic mail is not configured. Run `npm run calendar:auth` and set GOOGLE_OAUTH_* plus GOOGLE_CALENDAR_ID before rejecting.",
      503,
    );
  }

  const to = current.appointment.email?.trim().toLowerCase() ?? "";
  if (emailError(to, true)) {
    throw new RejectEmailError(
      "This request has no valid email, so a rejection notice cannot be sent. The booking was left pending.",
      400,
    );
  }

  await sendClinicEmail({
    to,
    subject: rejectEmailSubject(current),
    html: rejectEmailHtml(current, note),
    text: rejectEmailText(current, note),
  });

  const updated = await updateBookingStatus(reference, "rejected", note);
  if (!updated) {
    throw new RejectEmailError(
      `The notice was sent to ${formatPatientName(current.appointment)}, but the booking could not be saved. Check the queue before rejecting again.`,
      502,
    );
  }
  return updated;
}
