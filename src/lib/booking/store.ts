import type { BookingRecord, DocumentKind, StoredDocument } from "./records";
import type { FileBlob } from "./blobs";
import { supabaseConfigured } from "@/lib/supabase/admin";
import {
  getBookingRemote,
  getDocumentRemote,
  listBookingsRemote,
  saveBookingRemote,
  updateBookingStatusRemote,
} from "./persist";

const bookings = new Map<string, BookingRecord>();
const files = new Map<string, FileBlob>();

function fileKey(reference: string, kind: DocumentKind) {
  return `${reference}:${kind}`;
}

function saveBookingMemory(
  record: BookingRecord,
  documents: Record<DocumentKind, FileBlob | undefined>,
) {
  bookings.set(record.reference, record);
  for (const [kind, blob] of Object.entries(documents) as [
    DocumentKind,
    FileBlob | undefined,
  ][]) {
    if (blob) files.set(fileKey(record.reference, kind), blob);
  }
}

export async function saveBooking(
  record: BookingRecord,
  documents: Record<DocumentKind, FileBlob | undefined>,
) {
  if (supabaseConfigured()) {
    await saveBookingRemote(record, documents);
    return;
  }
  saveBookingMemory(record, documents);
}

export async function listBookings(): Promise<BookingRecord[]> {
  if (supabaseConfigured()) return listBookingsRemote();
  return [...bookings.values()].sort((a, b) =>
    a.createdAt < b.createdAt ? 1 : -1,
  );
}

export async function getBooking(
  reference: string,
): Promise<BookingRecord | undefined> {
  if (supabaseConfigured()) return getBookingRemote(reference);
  return bookings.get(reference);
}

export async function getDocument(
  reference: string,
  kind: DocumentKind,
): Promise<FileBlob | undefined> {
  if (supabaseConfigured()) return getDocumentRemote(reference, kind);
  return files.get(fileKey(reference, kind));
}

export async function updateBookingStatus(
  reference: string,
  decision: Exclude<BookingRecord["status"], "pending_verification">,
  note?: string,
): Promise<BookingRecord | undefined> {
  if (supabaseConfigured()) {
    return updateBookingStatusRemote(reference, decision, note);
  }

  const current = bookings.get(reference);
  if (!current) return undefined;

  const next: BookingRecord = {
    ...current,
    status: decision,
    review: {
      decidedAt: new Date().toISOString(),
      decision,
      note,
    },
  };
  bookings.set(reference, next);
  return next;
}

export function toStoredDocument(
  kind: DocumentKind,
  blob: FileBlob,
): StoredDocument {
  return {
    kind,
    filename: blob.filename,
    mimeType: blob.mimeType,
    size: blob.size,
  };
}

export type { FileBlob };
