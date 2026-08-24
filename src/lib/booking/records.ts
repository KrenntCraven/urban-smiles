/**
 * Canonical booking row used by the store, staff queue, and admin mapper.
 * Status starts at pending_verification after the public form submits.
 */
import type { AppointmentInput } from "./schema";

export const BOOKING_STATUSES = [
  "pending_verification",
  "approved",
  "rejected",
] as const;

export type BookingStatus = (typeof BOOKING_STATUSES)[number];

export type DocumentKind = "hmoCardFront" | "hmoCardBack" | "governmentId";

export interface StoredDocument {
  kind: DocumentKind;
  filename: string;
  mimeType: string;
  size: number;
}

export interface BookingRecord {
  reference: string;
  status: BookingStatus;
  createdAt: string;
  appointment: AppointmentInput;
  documents: StoredDocument[];
  staffInbox: string;
  review?: {
    decidedAt: string;
    decision: Exclude<BookingStatus, "pending_verification">;
    note?: string;
  };
  /** Google Calendar events.insert id; required before status can be approved. */
  calendarEventId?: string;
}
