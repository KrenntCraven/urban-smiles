/**
 * Approve path shared by /admin and /staff.
 *
 * Order matters: Google Calendar first, then persist "approved" + event id.
 * If the database write fails, the event is deleted so we never show Approved
 * without a calendar event, and never leave an orphan invite after a failed save.
 */
import type { BookingRecord } from "./records";
import {
  CalendarInviteError,
  deleteCalendarEvent,
} from "@/lib/calendar/google";
import { sendBookingInvite } from "@/lib/calendar/invite";
import { getBooking, updateBookingStatus } from "./store";

/** Invite then save. Idempotent if this booking already has a stored event id. */
export async function approveBookingWithInvite(
  reference: string,
): Promise<BookingRecord> {
  const current = await getBooking(reference);
  if (!current) {
    throw new CalendarInviteError("Booking not found.", 404);
  }
  if (current.status === "approved" && current.calendarEventId) {
    return current;
  }

  const eventId = await sendBookingInvite(current);
  try {
    const updated = await updateBookingStatus(
      reference,
      "approved",
      undefined,
      eventId,
    );
    if (!updated) {
      throw new CalendarInviteError("Booking not found.", 404);
    }
    return updated;
  } catch (error) {
    await deleteCalendarEvent(eventId);
    if (error instanceof CalendarInviteError) throw error;
    throw new CalendarInviteError(
      error instanceof Error
        ? `The invite was rolled back because the booking could not be saved: ${error.message}`
        : "The invite was rolled back because the booking could not be saved.",
    );
  }
}
