import { getServiceBySlug } from "@/lib/services/catalog";
import { formatPatientName, getLocationName } from "@/lib/booking/schema";
import type { AppointmentInput } from "@/lib/booking/schema";
import type { FileBlob } from "@/lib/booking/blobs";
import type { BookingRecord, DocumentKind } from "@/lib/booking/records";
import {
  createSupabaseAdmin,
  GOVERNMENT_ID_BUCKET,
  HMO_ID_BUCKET,
} from "@/lib/supabase/admin";

const DOCUMENT_KINDS: DocumentKind[] = [
  "hmoCardFront",
  "hmoCardBack",
  "governmentId",
];

type BookingRow = {
  id: string;
  patient_name: string;
  phone: string;
  email: string | null;
  branch_id: string;
  branch_name: string;
  service_slug: string;
  service_name: string;
  appointment_date: string;
  appointment_time: string;
  coverage_type: string;
  hmo_provider: string | null;
  hmo_member_id: string | null;
  is_new_patient: boolean;
  notes: string | null;
  status: BookingRecord["status"];
  review_note: string | null;
  decided_at: string | null;
  decision: "approved" | "rejected" | null;
  staff_inbox: string;
  appointment: AppointmentInput;
  created_at: string;
  booking_files?: FileRow[] | null;
};

type FileRow = {
  kind: DocumentKind;
  filename: string;
  mime_type: string;
  size: number;
  bucket: string;
  storage_path: string;
};

export function bucketFor(kind: DocumentKind): string {
  return kind === "governmentId" ? GOVERNMENT_ID_BUCKET : HMO_ID_BUCKET;
}

function extension(mimeType: string, filename: string): string {
  if (filename.includes(".")) {
    return filename.slice(filename.lastIndexOf("."));
  }
  if (mimeType === "image/png") return ".png";
  if (mimeType === "image/webp") return ".webp";
  return ".jpg";
}

function storagePath(
  reference: string,
  kind: DocumentKind,
  blob: FileBlob,
): string {
  return `${reference}/${kind}${extension(blob.mimeType, blob.filename)}`;
}

function toRecord(row: BookingRow): BookingRecord {
  const files = row.booking_files ?? [];
  const review =
    row.decision === "approved" || row.decision === "rejected"
      ? {
          decidedAt: row.decided_at ?? row.created_at,
          decision: row.decision,
          note: row.review_note ?? undefined,
        }
      : undefined;

  return {
    reference: row.id,
    status: row.status,
    createdAt: row.created_at,
    appointment: row.appointment,
    documents: files.map((file) => ({
      kind: file.kind,
      filename: file.filename,
      mimeType: file.mime_type,
      size: file.size,
    })),
    staffInbox: row.staff_inbox,
    review,
  };
}

function toRow(record: BookingRecord): Omit<BookingRow, "booking_files"> {
  const { appointment } = record;
  return {
    id: record.reference,
    patient_name: formatPatientName(appointment),
    phone: appointment.phone,
    email: appointment.email ?? null,
    branch_id: appointment.locationId,
    branch_name:
      getLocationName(appointment.locationId) ?? appointment.locationId,
    service_slug: appointment.serviceSlug,
    service_name:
      getServiceBySlug(appointment.serviceSlug)?.name ??
      appointment.serviceSlug,
    appointment_date: appointment.preferredDate,
    appointment_time: appointment.preferredTime,
    coverage_type: appointment.coverageType,
    hmo_provider: appointment.hmoProvider ?? null,
    hmo_member_id: appointment.hmoMemberId ?? null,
    is_new_patient: appointment.isNewPatient,
    notes: appointment.notes ?? null,
    status: record.status,
    review_note: record.review?.note ?? null,
    decided_at: record.review?.decidedAt ?? null,
    decision: record.review?.decision ?? null,
    staff_inbox: record.staffInbox,
    appointment,
    created_at: record.createdAt,
  };
}

function throwIfError(error: { message: string } | null, action: string) {
  if (error) {
    throw new Error(`${action}: ${error.message}`);
  }
}

export async function saveBookingRemote(
  record: BookingRecord,
  documents: Record<DocumentKind, FileBlob | undefined>,
) {
  const supabase = createSupabaseAdmin();
  const { error } = await supabase.from("bookings").upsert(toRow(record));
  throwIfError(error, "Could not save the booking");

  for (const kind of DOCUMENT_KINDS) {
    const blob = documents[kind];
    if (!blob) continue;

    const bucket = bucketFor(kind);
    const path = storagePath(record.reference, kind, blob);
    const { error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(path, blob.bytes, {
        contentType: blob.mimeType,
        upsert: true,
      });
    throwIfError(uploadError, `Could not store the ${kind} photo`);

    const file: FileRow = {
      kind,
      filename: blob.filename,
      mime_type: blob.mimeType,
      size: blob.size,
      bucket,
      storage_path: path,
    };
    const { error: fileError } = await supabase.from("booking_files").upsert(
      {
        booking_id: record.reference,
        ...file,
      },
      { onConflict: "booking_id,kind" },
    );
    throwIfError(fileError, "Could not record the uploaded file");
  }
}

export async function listBookingsRemote(): Promise<BookingRecord[]> {
  const supabase = createSupabaseAdmin();
  const { data, error } = await supabase
    .from("bookings")
    .select("*, booking_files(*)")
    .order("created_at", { ascending: false });
  throwIfError(error, "Could not list bookings");
  return ((data ?? []) as BookingRow[]).map(toRecord);
}

export async function getBookingRemote(
  reference: string,
): Promise<BookingRecord | undefined> {
  const supabase = createSupabaseAdmin();
  const { data, error } = await supabase
    .from("bookings")
    .select("*, booking_files(*)")
    .eq("id", reference)
    .maybeSingle();
  throwIfError(error, "Could not load the booking");
  return data ? toRecord(data as BookingRow) : undefined;
}

export async function getDocumentRemote(
  reference: string,
  kind: DocumentKind,
): Promise<FileBlob | undefined> {
  const supabase = createSupabaseAdmin();
  const { data, error } = await supabase
    .from("booking_files")
    .select("filename, mime_type, size, bucket, storage_path")
    .eq("booking_id", reference)
    .eq("kind", kind)
    .maybeSingle();
  throwIfError(error, "Could not load the document");
  if (!data) return undefined;

  const { data: bytes, error: downloadError } = await supabase.storage
    .from(data.bucket)
    .download(data.storage_path);
  throwIfError(downloadError, "Could not download the document");
  if (!bytes) return undefined;

  return {
    bytes: new Uint8Array(await bytes.arrayBuffer()),
    mimeType: data.mime_type,
    filename: data.filename,
    size: data.size,
  };
}

export async function updateBookingStatusRemote(
  reference: string,
  decision: Exclude<BookingRecord["status"], "pending_verification">,
  note?: string,
): Promise<BookingRecord | undefined> {
  const current = await getBookingRemote(reference);
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

  const supabase = createSupabaseAdmin();
  const { error } = await supabase
    .from("bookings")
    .update({
      status: next.status,
      decision,
      review_note: note ?? null,
      decided_at: next.review?.decidedAt,
    })
    .eq("id", reference);
  throwIfError(error, "Could not update the booking");
  return next;
}
