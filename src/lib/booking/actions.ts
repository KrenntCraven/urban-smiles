"use server";

import {
  appointmentSchema,
  type AppointmentField,
  type AppointmentInput,
} from "./schema";
import type { AppointmentFormState } from "./form-state";
import { getServiceBySlug } from "@/lib/services/catalog";
import { getDentistBySlug } from "@/lib/team/roster";

function readString(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

export async function submitAppointment(
  _prevState: AppointmentFormState,
  formData: FormData,
): Promise<AppointmentFormState> {
  const raw = {
    serviceSlug: readString(formData, "serviceSlug"),
    dentistSlug: readString(formData, "dentistSlug") || undefined,
    fullName: readString(formData, "fullName"),
    email: readString(formData, "email"),
    phone: readString(formData, "phone"),
    locationId: readString(formData, "locationId"),
    preferredDate: readString(formData, "preferredDate"),
    preferredTime: readString(formData, "preferredTime"),
    isNewPatient: formData.get("isNewPatient") === "on",
    notes: readString(formData, "notes") || undefined,
  };

  const echo: AppointmentFormState["values"] = {
    serviceSlug: raw.serviceSlug,
    dentistSlug: raw.dentistSlug,
    fullName: raw.fullName,
    email: raw.email,
    phone: raw.phone,
    locationId: raw.locationId,
    preferredDate: raw.preferredDate,
    preferredTime: raw.preferredTime,
    notes: raw.notes,
  };

  const parsed = appointmentSchema.safeParse(raw);

  if (!parsed.success) {
    const fieldErrors: Partial<Record<AppointmentField, string>> = {};
    for (const issue of parsed.error.issues) {
      const field = issue.path[0] as AppointmentField | undefined;
      if (field && !fieldErrors[field]) {
        fieldErrors[field] = issue.message;
      }
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

  if (
    parsed.data.dentistSlug &&
    !getDentistBySlug(parsed.data.dentistSlug)
  ) {
    return {
      status: "error",
      fieldErrors: { dentistSlug: "That dentist is no longer available." },
      values: echo,
    };
  }

  // Validation is complete and the payload is trustworthy from here. Persistence
  // and patient notification are not wired up yet — see BOOKING-BACKEND.
  const reference = createReference(parsed.data);

  return { status: "success", fieldErrors: {}, reference };
}

function createReference(appointment: AppointmentInput): string {
  const datePart = appointment.preferredDate.replaceAll("-", "").slice(2);
  const random = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `US-${datePart}-${random}`;
}
