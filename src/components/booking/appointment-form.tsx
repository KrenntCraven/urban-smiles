"use client";

import { useActionState, useEffect, useId, useRef } from "react";
import type { ReactNode } from "react";
import { submitAppointment } from "@/lib/booking/actions";
import { initialAppointmentState } from "@/lib/booking/form-state";
import {
  clinicToday,
  LOCATIONS,
  TIME_SLOTS,
  type AppointmentInput,
} from "@/lib/booking/schema";
import type { ServiceOption } from "@/lib/services/types";

const inputClass =
  "min-h-11 w-full rounded-xl border border-ink/15 bg-cream px-4 py-3 text-base text-ink transition-colors placeholder:text-muted/70 focus-visible:border-teal focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal sm:text-sm";

function Field({
  label,
  htmlFor,
  error,
  hint,
  children,
  className = "",
}: {
  label: string;
  htmlFor: string;
  error?: string;
  hint?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <label
        htmlFor={htmlFor}
        className="mb-1.5 block text-sm font-medium text-ink"
      >
        {label}
      </label>
      {children}
      {hint && !error ? (
        <p className="mt-1.5 text-xs text-muted">{hint}</p>
      ) : null}
      {error ? (
        <p id={`${htmlFor}-error`} className="mt-1.5 text-xs text-teal-dark">
          {error}
        </p>
      ) : null}
    </div>
  );
}

export function AppointmentForm({
  services,
  defaults,
  onSuccess,
}: {
  services: ServiceOption[];
  defaults: Partial<AppointmentInput>;
  onSuccess?: () => void;
}) {
  const [state, formAction, isPending] = useActionState(
    submitAppointment,
    initialAppointmentState,
  );
  const formId = useId();
  const fieldId = (name: string) => `${formId}-${name}`;

  // Applied to the DOM after mount rather than rendered, so a server/client
  // clock difference can never cause a hydration mismatch. The same rule is
  // enforced in appointmentSchema, which is what actually gates submission.
  const dateRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (dateRef.current) dateRef.current.min = clinicToday();
  }, []);

  useEffect(() => {
    if (state.status === "success") onSuccess?.();
  }, [state.status, onSuccess]);

  const errors = state.fieldErrors;
  const previous = state.values;
  const valueFor = (field: keyof AppointmentInput) =>
    previous?.[field] ?? (defaults[field] as string | undefined) ?? "";

  const describedBy = (field: keyof AppointmentInput) =>
    errors[field] ? `${fieldId(field)}-error` : undefined;

  if (state.status === "success") {
    return (
      <div className="rounded-2xl bg-mint/40 p-8 text-center ring-1 ring-teal/20">
        <span className="mx-auto flex size-12 items-center justify-center rounded-full bg-teal text-cream">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
            className="size-6"
          >
            <path d="m5 12.5 4.5 4.5L19 7.5" />
          </svg>
        </span>
        <h3 className="mt-5 font-display text-2xl font-semibold text-ink">
          Request received
        </h3>
        <p className="mt-2 text-sm text-muted">
          Reference{" "}
          <span className="font-semibold text-ink tabular-nums">
            {state.reference}
          </span>
          . Our team will text you within one business hour to confirm the slot.
        </p>
      </div>
    );
  }

  return (
    <form action={formAction} noValidate className="space-y-5">
      {valueFor("dentistSlug") ? (
        <input
          type="hidden"
          name="dentistSlug"
          value={valueFor("dentistSlug")}
        />
      ) : null}
      <Field
        label="Service"
        htmlFor={fieldId("serviceSlug")}
        error={errors.serviceSlug}
      >
        <select
          id={fieldId("serviceSlug")}
          name="serviceSlug"
          defaultValue={valueFor("serviceSlug")}
          aria-invalid={Boolean(errors.serviceSlug)}
          aria-describedby={describedBy("serviceSlug")}
          className={inputClass}
        >
          <option value="">Select a treatment</option>
          {services.map((service) => (
            <option key={service.slug} value={service.slug}>
              {service.name}
            </option>
          ))}
        </select>
      </Field>

      <div className="grid gap-5 sm:grid-cols-2">
        <Field
          label="Full name"
          htmlFor={fieldId("fullName")}
          error={errors.fullName}
        >
          <input
            id={fieldId("fullName")}
            name="fullName"
            type="text"
            autoComplete="name"
            defaultValue={valueFor("fullName")}
            aria-invalid={Boolean(errors.fullName)}
            aria-describedby={describedBy("fullName")}
            className={inputClass}
          />
        </Field>

        <Field
          label="Mobile number"
          htmlFor={fieldId("phone")}
          error={errors.phone}
          hint="We confirm your slot by SMS."
        >
          <input
            id={fieldId("phone")}
            name="phone"
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            placeholder="09171234567"
            defaultValue={valueFor("phone")}
            aria-invalid={Boolean(errors.phone)}
            aria-describedby={describedBy("phone")}
            className={inputClass}
          />
        </Field>
      </div>

      <Field label="Email" htmlFor={fieldId("email")} error={errors.email}>
        <input
          id={fieldId("email")}
          name="email"
          type="email"
          autoComplete="email"
          defaultValue={valueFor("email")}
          aria-invalid={Boolean(errors.email)}
          aria-describedby={describedBy("email")}
          className={inputClass}
        />
      </Field>

      <Field
        label="Branch"
        htmlFor={fieldId("locationId")}
        error={errors.locationId}
      >
        <select
          id={fieldId("locationId")}
          name="locationId"
          defaultValue={valueFor("locationId")}
          aria-invalid={Boolean(errors.locationId)}
          aria-describedby={describedBy("locationId")}
          className={inputClass}
        >
          <option value="">Select a branch</option>
          {LOCATIONS.map((location) => (
            <option key={location.id} value={location.id}>
              {location.name}
            </option>
          ))}
        </select>
      </Field>

      <div className="grid gap-5 sm:grid-cols-2">
        <Field
          label="Preferred date"
          htmlFor={fieldId("preferredDate")}
          error={errors.preferredDate}
        >
          <input
            ref={dateRef}
            id={fieldId("preferredDate")}
            name="preferredDate"
            type="date"
            defaultValue={valueFor("preferredDate")}
            aria-invalid={Boolean(errors.preferredDate)}
            aria-describedby={describedBy("preferredDate")}
            className={`${inputClass} tabular-nums`}
          />
        </Field>

        <Field
          label="Preferred time"
          htmlFor={fieldId("preferredTime")}
          error={errors.preferredTime}
        >
          <select
            id={fieldId("preferredTime")}
            name="preferredTime"
            defaultValue={valueFor("preferredTime")}
            aria-invalid={Boolean(errors.preferredTime)}
            aria-describedby={describedBy("preferredTime")}
            className={`${inputClass} tabular-nums`}
          >
            <option value="">Select a time</option>
            {TIME_SLOTS.map((slot) => (
              <option key={slot} value={slot}>
                {slot}
              </option>
            ))}
          </select>
        </Field>
      </div>

      <Field
        label="Anything we should know?"
        htmlFor={fieldId("notes")}
        error={errors.notes}
        hint="Optional — pain, anxiety, or scheduling constraints."
      >
        <textarea
          id={fieldId("notes")}
          name="notes"
          rows={3}
          defaultValue={valueFor("notes")}
          aria-invalid={Boolean(errors.notes)}
          aria-describedby={describedBy("notes")}
          className={`${inputClass} resize-y`}
        />
      </Field>

      <label className="flex min-h-11 items-center gap-3 rounded-xl text-sm text-muted">
        <input
          type="checkbox"
          name="isNewPatient"
          defaultChecked
          className="size-5 shrink-0 rounded border-ink/25 text-teal focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal"
        />
        This is my first visit to Urban Smiles
      </label>

      {state.formError ? (
        <p className="text-sm text-teal-dark" role="alert">
          {state.formError}
        </p>
      ) : null}

      <div>
        <button
          type="submit"
          disabled={isPending}
          className="inline-flex w-full items-center justify-center rounded-full bg-teal px-7 py-3.5 text-base font-semibold text-cream shadow-lg shadow-teal/20 transition-colors hover:bg-teal-dark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal disabled:cursor-not-allowed disabled:opacity-70"
        >
          {isPending ? "Sending request…" : "Confirm Booking Request"}
        </button>
        <p className="mt-3 text-center text-xs text-muted">
          No payment today · Free to reschedule up to 24 hours before
        </p>
      </div>
    </form>
  );
}
