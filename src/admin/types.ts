import type { CoverageType } from "@/lib/booking/schema";
import type { DocumentKind } from "@/lib/booking/records";

export const ADMIN_BOOKING_STATUSES = [
  "pending",
  "approved",
  "rejected",
] as const;

export type AdminBookingStatus = (typeof ADMIN_BOOKING_STATUSES)[number];

export type AdminProof = {
  kind: DocumentKind;
  filename: string;
  url: string;
};

export type AdminBooking = {
  id: string;
  patientName: string;
  phone: string;
  email: string | null;
  branchId: string;
  branchName: string;
  serviceSlug: string;
  serviceName: string;
  appointmentDate: string;
  appointmentTime: string;
  coverageType: CoverageType;
  hmoProvider: string | null;
  hmoMemberId: string | null;
  isNewPatient: boolean;
  notes: string | null;
  submittedAt: string;
  status: AdminBookingStatus;
  proofs: AdminProof[];
  reviewNote?: string;
};

export type AdminBookingQuery = {
  status?: AdminBookingStatus | "all";
  q?: string;
  branch?: string;
  sort?: "date_asc" | "date_desc";
};

export type AdminBookingList = {
  items: AdminBooking[];
};
