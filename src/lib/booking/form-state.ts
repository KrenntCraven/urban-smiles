import type { AppointmentField } from "./schema";

export interface AppointmentFormState {
  status: "idle" | "success" | "error";
  fieldErrors: Partial<Record<AppointmentField, string>>;
  formError?: string;
  reference?: string;
  values?: Partial<Record<AppointmentField, string>>;
}

export const initialAppointmentState: AppointmentFormState = {
  status: "idle",
  fieldErrors: {},
};
