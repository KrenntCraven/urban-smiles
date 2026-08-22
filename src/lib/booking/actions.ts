"use server";

import { createHash } from "node:crypto";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import {
  appointmentSchema,
  formatPatientName,
  type AppointmentField,
  type AppointmentInput,
  type BookingChannel,
  type CoverageType,
  type HmoProvider,
  type NameSuffix,
} from "./schema";
import type { AppointmentFormState } from "./form-state";
import { parseRequiredDocuments } from "./files";
import { getServiceBySlug } from "@/lib/services/catalog";
import { getDentistBySlug } from "@/lib/team/roster";
import {
  getBooking,
  saveBooking,
  toStoredDocument,
  updateBookingStatus,
} from "./store";

const STAFF_COOKIE = "us_staff";

function readString(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

function readOptional(formData: FormData, key: string): string | undefined {
  const value = readString(formData, key).trim();
  return value ? value : undefined;
}

function staffSecret() {
  return process.env.STAFF_PIN?.trim() || "";
}

function staffToken() {
  const pin = staffSecret();
  if (!pin) return "";
  return createHash("sha256").update(`urban-smiles:${pin}`).digest("hex");
}

export async function isStaffAuthenticated(): Promise<boolean> {
  const token = staffToken();
  if (!token) return false;
  const jar = await cookies();
  return jar.get(STAFF_COOKIE)?.value === token;
}

export async function loginStaff(
  _prev: { error?: string },
  formData: FormData,
): Promise<{ error?: string }> {
  const pin = staffSecret();
  if (!pin) {
    return {
      error: "Set STAFF_PIN in the environment before reviewing bookings.",
    };
  }
  if (readString(formData, "pin") !== pin) {
    return { error: "That PIN is incorrect." };
  }

  const jar = await cookies();
  jar.set(STAFF_COOKIE, staffToken(), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/staff",
    maxAge: 60 * 60 * 12,
  });
  revalidatePath("/staff");
  return {};
}

export async function logoutStaff() {
  const jar = await cookies();
  jar.delete(STAFF_COOKIE);
  revalidatePath("/staff");
}

function echoFrom(raw: Record<string, string | undefined>) {
  const values: NonNullable<AppointmentFormState["values"]> = {};
  for (const [key, value] of Object.entries(raw)) {
    if (value) values[key as AppointmentField] = value;
  }
  return values;
}

export async function submitAppointment(
  _prevState: AppointmentFormState,
  formData: FormData,
): Promise<AppointmentFormState> {
  const channel = (readOptional(formData, "channel") ??
    "website") as BookingChannel;
  const coverageType = readString(formData, "coverageType") as CoverageType;
  const suffix = readOptional(formData, "suffix") as NameSuffix | undefined;
  const hmoProvider = readOptional(formData, "hmoProvider") as
    | HmoProvider
    | undefined;

  const raw: Record<string, string | undefined> = {
    serviceSlug: readString(formData, "serviceSlug"),
    dentistSlug: readOptional(formData, "dentistSlug"),
    firstName: readString(formData, "firstName"),
    middleName: readOptional(formData, "middleName"),
    surname: readString(formData, "surname"),
    suffix,
    email: readOptional(formData, "email"),
    phone: readString(formData, "phone"),
    locationId: readString(formData, "locationId"),
    preferredDate: readString(formData, "preferredDate"),
    preferredTime: readString(formData, "preferredTime"),
    coverageType,
    hmoProvider,
    hmoMemberId: readOptional(formData, "hmoMemberId"),
    notes: readOptional(formData, "notes"),
    channel,
  };

  const parsed = appointmentSchema.safeParse({
    ...raw,
    noMiddleName: formData.get("noMiddleName") === "on",
    privacyConsent: formData.get("privacyConsent") === "on",
    isNewPatient: formData.get("isNewPatient") === "on",
    suffix,
    hmoProvider,
    channel,
  });

  const echo = echoFrom(raw);
  if (formData.get("noMiddleName") === "on") echo.noMiddleName = "true";
  if (formData.get("privacyConsent") === "on") echo.privacyConsent = "true";

  if (!parsed.success) {
    const fieldErrors: Partial<Record<AppointmentField, string>> = {};
    for (const issue of parsed.error.issues) {
      const field = issue.path[0] as AppointmentField | undefined;
      if (field && !fieldErrors[field]) fieldErrors[field] = issue.message;
    }
    return { status: "error", fieldErrors, values: echo };
  }

  if (!getServiceBySlug(parsed.data.serviceSlug)) {
    return {
      status: "error",
      fieldErrors: { serviceSlug: "That service is no longer available." },
      values: echo,
    };
  }

  if (parsed.data.dentistSlug && !getDentistBySlug(parsed.data.dentistSlug)) {
    return {
      status: "error",
      fieldErrors: { dentistSlug: "That dentist is no longer available." },
      values: echo,
    };
  }

  const documents = await parseRequiredDocuments(
    formData,
    parsed.data.coverageType,
  );
  if (!documents.ok) {
    const documentErrors: NonNullable<AppointmentFormState["documentErrors"]> =
      {};
    for (const issue of documents.issues) {
      documentErrors[issue.field] = issue.message;
    }
    return {
      status: "error",
      fieldErrors: {},
      documentErrors,
      formError: "Add the required ID or HMO photo before submitting.",
      values: echo,
    };
  }

  const reference = createReference(parsed.data);
  const stored = Object.entries(documents.documents).map(([kind, blob]) =>
    toStoredDocument(kind as keyof typeof documents.documents, blob!),
  );

  saveBooking(
    {
      reference,
      status: "pending_verification",
      createdAt: new Date().toISOString(),
      appointment: parsed.data,
      documents: stored,
      staffInbox: `${formatPatientName(parsed.data)} submitted ID/HMO documents for ${parsed.data.preferredDate} ${parsed.data.preferredTime}.`,
    },
    {
      hmoCardFront: documents.documents.hmoCardFront,
      hmoCardBack: documents.documents.hmoCardBack,
      governmentId: documents.documents.governmentId,
    },
  );

  return {
    status: "success",
    fieldErrors: {},
    reference,
    bookingStatus: "pending_verification",
  };
}

function createReference(appointment: AppointmentInput): string {
  const datePart = appointment.preferredDate.replaceAll("-", "").slice(2);
  const random = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `US-${datePart}-${random}`;
}

export async function reviewBooking(
  _prev: { error?: string },
  formData: FormData,
): Promise<{ error?: string }> {
  if (!(await isStaffAuthenticated())) {
    return { error: "Sign in to review bookings." };
  }

  const reference = readString(formData, "reference");
  const decision = readString(formData, "decision");
  const note = readOptional(formData, "note");

  if (decision !== "approved" && decision !== "rejected") {
    return { error: "Choose approve or reject." };
  }
  if (!getBooking(reference)) {
    return { error: "That booking is no longer in the queue." };
  }

  updateBookingStatus(reference, decision, note);
  revalidatePath("/staff");
  return {};
}
