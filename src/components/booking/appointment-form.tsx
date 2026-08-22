"use client";

import { useActionState, useEffect, useId, useState } from "react";
import type { FocusEvent } from "react";
import { submitAppointment } from "@/lib/booking/actions";
import {
  bookingCopy,
  Field,
  fieldCopy,
  groupTitleClass,
  inputClass,
} from "@/components/booking/field";
import { PatientVerificationFields } from "@/components/booking/patient-fields";
import { initialAppointmentState } from "@/lib/booking/form-state";
import {
  bindClinicDateMin,
  LOCATIONS,
  TIME_SLOTS,
  toNameCase,
  type AppointmentInput,
  type CoverageType,
} from "@/lib/booking/schema";
import type { ServiceOption } from "@/lib/services/types";

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
  const [coverageType, setCoverageType] = useState<CoverageType>(
    (state.values?.coverageType as CoverageType) || "self-pay",
  );
  const [noMiddleName, setNoMiddleName] = useState(
    state.values?.noMiddleName === "true",
  );

  useEffect(() => {
    if (state.status === "success") onSuccess?.();
  }, [state.status, onSuccess]);

  const errors = state.fieldErrors;
  const documentErrors = state.documentErrors ?? {};
  const previous = state.values;
  const valueFor = (field: keyof AppointmentInput) =>
    previous?.[field] ?? (defaults[field] as string | undefined) ?? "";

  const describedBy = (field: keyof AppointmentInput) =>
    errors[field] ? `${fieldId(field)}-error` : undefined;

  // Mirrors the transform in appointmentSchema so the patient sees the stored
  // spelling before submitting, not after.
  const applyNameCase = (event: FocusEvent<HTMLInputElement>) => {
    event.currentTarget.value = toNameCase(event.currentTarget.value);
  };

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
          Pending verification
        </h3>
        <p className="mt-2 text-sm text-muted">
          Reference{" "}
          <span className="font-semibold text-ink tabular-nums">
            {state.reference}
          </span>
          . Front desk will review your ID or HMO card before confirming the
          slot by SMS.
        </p>
      </div>
    );
  }

  return (
    <form action={formAction} noValidate className="space-y-8">
      <input type="hidden" name="channel" value="website" />
      {valueFor("dentistSlug") ? (
        <input
          type="hidden"
          name="dentistSlug"
          value={valueFor("dentistSlug")}
        />
      ) : null}

      <section className="space-y-5">
        <h2 className={groupTitleClass}>{bookingCopy.visitGroup}</h2>
        <Field
          label={fieldCopy.locationId.label}
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

        <Field
          label={fieldCopy.serviceSlug.label}
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
            label={fieldCopy.preferredDate.label}
            htmlFor={fieldId("preferredDate")}
            error={errors.preferredDate}
          >
            <input
              ref={bindClinicDateMin}
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
            label={fieldCopy.preferredTime.label}
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
      </section>

      <PatientVerificationFields
        idFor={fieldId}
        errors={errors}
        documentErrors={documentErrors}
        coverageType={coverageType}
        noMiddleName={noMiddleName}
        firstName={{
          name: "firstName",
          defaultValue: valueFor("firstName"),
          onBlur: applyNameCase,
        }}
        surname={{
          name: "surname",
          defaultValue: valueFor("surname"),
          onBlur: applyNameCase,
        }}
        middleName={{
          name: "middleName",
          defaultValue: valueFor("middleName"),
          onBlur: applyNameCase,
        }}
        suffix={{
          name: "suffix",
          defaultValue: valueFor("suffix"),
        }}
        phone={{
          name: "phone",
          defaultValue: valueFor("phone"),
        }}
        email={{
          name: "email",
          defaultValue: valueFor("email"),
        }}
        coverageTypeBind={{
          name: "coverageType",
          onChange: (event) =>
            setCoverageType(event.currentTarget.value as CoverageType),
        }}
        hmoProvider={{
          name: "hmoProvider",
          defaultValue: valueFor("hmoProvider"),
        }}
        hmoMemberId={{
          name: "hmoMemberId",
          defaultValue: valueFor("hmoMemberId"),
        }}
        noMiddleNameBind={{
          name: "noMiddleName",
          checked: noMiddleName,
          onChange: (event) => setNoMiddleName(event.currentTarget.checked),
        }}
        privacyConsent={{
          name: "privacyConsent",
          required: true,
        }}
        isNewPatient={{
          name: "isNewPatient",
          defaultChecked: true,
        }}
      />

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
          {isPending ? "Sending request…" : "Submit for verification"}
        </button>
        <p className="mt-3 text-center text-xs text-muted">
          Status starts as pending verification · No payment today
        </p>
      </div>
    </form>
  );
}
