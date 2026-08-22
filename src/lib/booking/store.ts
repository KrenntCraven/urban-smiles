import type { BookingRecord, DocumentKind, StoredDocument } from "./records";

type FileBlob = {
  bytes: Uint8Array;
  mimeType: string;
  filename: string;
  size: number;
};

const bookings = new Map<string, BookingRecord>();
const files = new Map<string, FileBlob>();

function fileKey(reference: string, kind: DocumentKind) {
  return `${reference}:${kind}`;
}

export function saveBooking(
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

export function listBookings(): BookingRecord[] {
  return [...bookings.values()].sort((a, b) =>
    a.createdAt < b.createdAt ? 1 : -1,
  );
}

export function getBooking(reference: string): BookingRecord | undefined {
  return bookings.get(reference);
}

export function getDocument(
  reference: string,
  kind: DocumentKind,
): FileBlob | undefined {
  return files.get(fileKey(reference, kind));
}

export function updateBookingStatus(
  reference: string,
  decision: Exclude<BookingRecord["status"], "pending_verification">,
  note?: string,
): BookingRecord | undefined {
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
