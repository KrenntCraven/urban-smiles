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
}
