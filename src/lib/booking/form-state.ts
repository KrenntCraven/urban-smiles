import type { DocumentKind } from "./records";
import type { AppointmentField } from "./schema";

export interface AppointmentFormState {
  status: "idle" | "success" | "error";
  fieldErrors: Partial<Record<AppointmentField, string>>;
  documentErrors?: Partial<Record<DocumentKind, string>>;
  formError?: string;
  reference?: string;
  bookingStatus?: "pending_verification";
  values?: Partial<Record<AppointmentField, string>>;
}

export const initialAppointmentState: AppointmentFormState = {
  status: "idle",
  fieldErrors: {},
};
