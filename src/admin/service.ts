import { revalidatePath } from "next/cache";
import { getServiceBySlug } from "@/lib/services/catalog";
import {
  formatPatientName,
  getLocationName,
  LOCATIONS,
} from "@/lib/booking/schema";
import type {
  BookingRecord,
  BookingStatus,
  DocumentKind,
} from "@/lib/booking/records";
import {
  getBooking,
  getDocument,
  listBookings,
  updateBookingStatus,
} from "@/lib/booking/store";
import { supabaseConfigured } from "@/lib/supabase/admin";
import { fetchFastApi, fetchFastApiFile } from "./fastapi";
import { buildSearchIndex, matchesSearch } from "./search";
import { ensureDemoBookings } from "./seed";
import { summarizeBookings } from "./summary";
import type {
  AdminBooking,
  AdminBookingList,
  AdminBookingQuery,
  AdminBookingStatus,
  AdminProof,
} from "./types";

const DOCUMENT_KINDS: DocumentKind[] = [
  "hmoCardFront",
  "hmoCardBack",
  "governmentId",
];

export function fastapiConfigured(): boolean {
  return Boolean(
    process.env.FASTAPI_BASE_URL?.trim() && process.env.ADMIN_API_TOKEN?.trim(),
  );
}

function toAdminStatus(status: BookingStatus): AdminBookingStatus {
  return status === "pending_verification" ? "pending" : status;
}

function proofUrl(id: string, kind: DocumentKind): string {
  return `/api/v1/admin/bookings/${encodeURIComponent(id)}/files/${kind}`;
}

export function toAdminBooking(record: BookingRecord): AdminBooking {
  const { appointment } = record;
  return {
    id: record.reference,
    patientName: formatPatientName(appointment),
    phone: appointment.phone,
    email: appointment.email ?? null,
    branchId: appointment.locationId,
    branchName:
      getLocationName(appointment.locationId) ?? appointment.locationId,
    serviceSlug: appointment.serviceSlug,
    serviceName:
      getServiceBySlug(appointment.serviceSlug)?.name ??
      appointment.serviceSlug,
    appointmentDate: appointment.preferredDate,
    appointmentTime: appointment.preferredTime,
    coverageType: appointment.coverageType,
    hmoProvider: appointment.hmoProvider ?? null,
    hmoMemberId: appointment.hmoMemberId ?? null,
    isNewPatient: appointment.isNewPatient,
    notes: appointment.notes ?? null,
    submittedAt: record.createdAt,
    decidedAt: record.review?.decidedAt ?? null,
    status: toAdminStatus(record.status),
    proofs: record.documents.map((document) => ({
      kind: document.kind,
      filename: document.filename,
      url: proofUrl(record.reference, document.kind),
    })),
    reviewNote: record.review?.note,
  };
}

function matchesQuery(
  booking: AdminBooking,
  query: AdminBookingQuery,
): boolean {
  if (
    query.status &&
    query.status !== "all" &&
    booking.status !== query.status
  ) {
    return false;
  }
  if (query.branch && booking.branchId !== query.branch) {
    return false;
  }
  const needle = query.q?.trim();
  if (!needle) return true;
  return matchesSearch(buildSearchIndex(booking), needle);
}

function sortBookings(
  items: AdminBooking[],
  sort: AdminBookingQuery["sort"],
): AdminBooking[] {
  const direction = sort === "date_asc" ? 1 : -1;
  return [...items].sort((a, b) => {
    const left = `${a.appointmentDate}T${a.appointmentTime}`;
    const right = `${b.appointmentDate}T${b.appointmentTime}`;
    if (left === right) return a.id.localeCompare(b.id);
    return left < right ? -direction : direction;
  });
}

function normalizeRemote(payload: unknown): AdminBooking {
  const row = payload as Record<string, unknown>;
  const proofs = Array.isArray(row.proofs)
    ? (row.proofs as AdminProof[]).map((proof) => ({
        kind: proof.kind,
        filename: proof.filename,
        url: proof.url || proofUrl(String(row.id), proof.kind),
      }))
    : [];

  return {
    id: String(row.id ?? row.reference ?? ""),
    patientName: String(row.patientName ?? row.patient_name ?? ""),
    phone: String(row.phone ?? ""),
    email: (row.email as string | null) ?? null,
    branchId: String(row.branchId ?? row.branch_id ?? ""),
    branchName: String(row.branchName ?? row.branch_name ?? ""),
    serviceSlug: String(row.serviceSlug ?? row.service_slug ?? ""),
    serviceName: String(row.serviceName ?? row.service_name ?? ""),
    appointmentDate: String(row.appointmentDate ?? row.appointment_date ?? ""),
    appointmentTime: String(row.appointmentTime ?? row.appointment_time ?? ""),
    coverageType: (row.coverageType ??
      row.coverage_type) as AdminBooking["coverageType"],
    hmoProvider: (row.hmoProvider ?? row.hmo_provider ?? null) as string | null,
    hmoMemberId: (row.hmoMemberId ?? row.hmo_member_id ?? null) as
      string | null,
    isNewPatient: Boolean(row.isNewPatient ?? row.is_new_patient ?? false),
    notes: (row.notes ?? null) as string | null,
    submittedAt: String(
      row.submittedAt ?? row.submitted_at ?? row.created_at ?? "",
    ),
    decidedAt:
      (row.decidedAt as string | null | undefined) ??
      (row.decided_at as string | null | undefined) ??
      null,
    status: (row.status as AdminBookingStatus) ?? "pending",
    proofs,
    reviewNote: (row.reviewNote ?? row.review_note) as string | undefined,
  };
}

export function parseAdminQuery(
  searchParams: URLSearchParams,
): AdminBookingQuery {
  const status = searchParams.get("status") as AdminBookingQuery["status"];
  const sort = searchParams.get("sort") as AdminBookingQuery["sort"];
  return {
    status: status || "pending",
    q: searchParams.get("q") ?? undefined,
    branch: searchParams.get("branch") ?? undefined,
    sort: sort === "date_asc" ? "date_asc" : "date_desc",
  };
}

function rowsFromPayload(payload: unknown): unknown[] {
  if (Array.isArray(payload)) return payload;
  const body = payload as { items?: unknown[]; results?: unknown[] };
  return body.items ?? body.results ?? [];
}

async function listFromFastApi(
  query: AdminBookingQuery,
): Promise<AdminBooking[]> {
  const params = new URLSearchParams();
  if (query.status && query.status !== "all") {
    params.set("status", query.status);
  } else {
    params.set("status", "all");
  }
  if (query.q) params.set("q", query.q);
  if (query.branch) params.set("branch", query.branch);
  if (query.sort) params.set("sort", query.sort);
  const payload = await fetchFastApi<unknown>(
    `/api/v1/admin/bookings?${params.toString()}`,
  );
  return rowsFromPayload(payload).map(normalizeRemote);
}

async function listAllMapped(): Promise<AdminBooking[]> {
  if (!supabaseConfigured() && fastapiConfigured()) {
    return listFromFastApi({ status: "all", sort: "date_desc" });
  }
  await ensureDemoBookings();
  return (await listBookings()).map(toAdminBooking);
}

export async function listAdminBookings(
  query: AdminBookingQuery,
): Promise<AdminBookingList> {
  const branches = adminBranches();

  if (!supabaseConfigured() && fastapiConfigured()) {
    const [items, all] = await Promise.all([
      listFromFastApi(query),
      listAllMapped(),
    ]);
    return { items, summary: summarizeBookings(all, branches) };
  }

  const all = await listAllMapped();
  const items = sortBookings(
    all.filter((booking) => matchesQuery(booking, query)),
    query.sort,
  );
  return { items, summary: summarizeBookings(all, branches) };
}

function bumpAdminCaches() {
  revalidatePath("/admin/bookings");
  revalidatePath("/staff");
}

export async function approveAdminBooking(id: string): Promise<AdminBooking> {
  if (!supabaseConfigured() && fastapiConfigured()) {
    const payload = await fetchFastApi<unknown>(
      `/api/v1/admin/bookings/${encodeURIComponent(id)}/approve`,
      { method: "POST" },
    );
    bumpAdminCaches();
    return normalizeRemote(payload);
  }

  const updated = await updateBookingStatus(id, "approved");
  if (!updated) {
    throw new AdminServiceError("Booking not found.", 404);
  }
  bumpAdminCaches();
  return toAdminBooking(updated);
}

export async function rejectAdminBooking(
  id: string,
  reason: string,
): Promise<AdminBooking> {
  const note = reason.trim();
  if (note.length < 3) {
    throw new AdminServiceError("Add a short reason for the patient.", 400);
  }

  if (!supabaseConfigured() && fastapiConfigured()) {
    const payload = await fetchFastApi<unknown>(
      `/api/v1/admin/bookings/${encodeURIComponent(id)}/reject`,
      {
        method: "POST",
        body: JSON.stringify({ reason: note }),
      },
    );
    bumpAdminCaches();
    return normalizeRemote(payload);
  }

  const updated = await updateBookingStatus(id, "rejected", note);
  if (!updated) {
    throw new AdminServiceError("Booking not found.", 404);
  }
  bumpAdminCaches();
  return toAdminBooking(updated);
}

export async function readAdminDocument(id: string, kind: DocumentKind) {
  if (!DOCUMENT_KINDS.includes(kind)) return undefined;

  if (!supabaseConfigured() && fastapiConfigured()) {
    return fetchFastApiFile(
      `/api/v1/admin/bookings/${encodeURIComponent(id)}/files/${kind}`,
    );
  }

  await ensureDemoBookings();
  if (!(await getBooking(id))) return undefined;
  return getDocument(id, kind);
}

export function adminBranches() {
  return LOCATIONS.map((location) => ({
    id: location.id,
    name: location.name,
  }));
}

export class AdminServiceError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
  }
}
