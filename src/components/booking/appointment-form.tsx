"use client";

import {
  useActionState,
  useEffect,
  useId,
  useRef,
  useState,
} from "react";
import type { FocusEvent, MouseEvent, ReactNode } from "react";
import { submitAppointment } from "@/lib/booking/actions";
import {
  bookingCopy,
  Field,
  fieldCopy,
  groupTitleClass,
  inputClass,
  openDatePicker,
} from "@/components/booking/field";
import { PatientVerificationFields } from "@/components/booking/patient-fields";
import { initialAppointmentState } from "@/lib/booking/form-state";
import {
  bindClinicDateMin,
  LOCATIONS,
  TIME_SLOTS,
  toNameCase,
  type AppointmentField,
  type AppointmentInput,
  type CoverageType,
} from "@/lib/booking/schema";
import type { ServiceOption } from "@/lib/services/types";

const mobileSteps = ["visit", "identity", "coverage"] as const;
type MobileStep = (typeof mobileSteps)[number];

const mobileStepLabels: Record<MobileStep, string> = {
  visit: "Visit",
  identity: "You",
  coverage: "Coverage",
};

const visitFields: AppointmentField[] = [
  "locationId",
  "serviceSlug",
  "preferredDate",
  "preferredTime",
];
const identityFields: AppointmentField[] = [
  "firstName",
  "middleName",
  "noMiddleName",
  "surname",
  "suffix",
  "phone",
  "email",
];

function applyAppointmentStep(root: HTMLElement, step: MobileStep) {
  root.dataset.appointmentStep = step;
  const mobile = window.matchMedia("(max-width: 767px)").matches;
  const panels = root.querySelectorAll<HTMLElement>(
    "[data-booking-panel], [data-verification-panel]",
  );
  panels.forEach((panel) => {
    const panelName =
      panel.dataset.bookingPanel ?? panel.dataset.verificationPanel;
    const active = !mobile || panelName === step;
    if (active) panel.removeAttribute("aria-hidden");
    else panel.setAttribute("aria-hidden", "true");

    panel
      .querySelectorAll<HTMLElement>(
        "button, input, select, textarea, a[href]",
      )
      .forEach((control) => {
        if (!active) {
          if (!control.hasAttribute("data-step-tab-managed")) {
            control.dataset.stepTabManaged =
              control.getAttribute("tabindex") ?? "";
          }
          control.tabIndex = -1;
        } else if (control.hasAttribute("data-step-tab-managed")) {
          const previous = control.dataset.stepTabManaged;
          if (previous) control.setAttribute("tabindex", previous);
          else control.removeAttribute("tabindex");
          delete control.dataset.stepTabManaged;
        }
      });
  });
}

function AppointmentStepLayout({
  requestedStep,
  children,
}: {
  requestedStep?: MobileStep;
  children: ReactNode;
}) {
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!requestedStep) return;
    const frame = requestAnimationFrame(() => {
      if (rootRef.current) applyAppointmentStep(rootRef.current, requestedStep);
    });
    return () => cancelAnimationFrame(frame);
  }, [requestedStep]);

  useEffect(() => {
    const query = window.matchMedia("(max-width: 767px)");
    const syncPanels = () => {
      const root = rootRef.current;
      if (!root) return;
      applyAppointmentStep(
        root,
        (root.dataset.appointmentStep as MobileStep) || "visit",
      );
    };

    syncPanels();
    query.addEventListener("change", syncPanels);
    return () => query.removeEventListener("change", syncPanels);
  }, []);

  return (
    <div ref={rootRef} data-appointment-step="visit">
      {children}
    </div>
  );
}

function AppointmentMobileProgress() {
  return (
    <ol
      aria-label="Booking progress"
      className="mb-8 grid grid-cols-3 overflow-hidden rounded-2xl bg-sand/40 ring-1 ring-ink/10 md:hidden"
    >
      {mobileSteps.map((item, index) => (
          <li key={item} data-progress-step={item} className="px-2 py-3 text-center">
            <span className="mx-auto flex size-8 items-center justify-center rounded-full bg-cream text-xs font-semibold text-muted ring-1 ring-ink/10 tabular-nums">
              {index + 1}
            </span>
            <span className="mt-1.5 block text-xs font-semibold text-ink">
              {mobileStepLabels[item]}
            </span>
          </li>
      ))}
    </ol>
  );
}

function goToAppointmentStep(
  event: MouseEvent<HTMLButtonElement>,
  step: MobileStep,
) {
  const root = event.currentTarget.closest<HTMLElement>(
    "[data-appointment-step]",
  );
  if (root) applyAppointmentStep(root, step);
}

function AppointmentMobileNavigation({ isPending }: { isPending: boolean }) {
  return (
    <div
      data-booking-mobile-nav
      className="mt-8 flex gap-3 border-t border-ink/10 pt-6 md:hidden"
    >
      <button
        data-mobile-nav-step
        data-show-on-step="identity"
        type="button"
        onClick={(event) => goToAppointmentStep(event, "visit")}
        className="min-h-11 flex-1 items-center justify-center rounded-full border border-ink/20 px-5 text-sm font-semibold text-ink transition-colors hover:border-teal hover:text-teal focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal"
      >
        Back
      </button>
      <button
        data-mobile-nav-step
        data-show-on-step="coverage"
        type="button"
        onClick={(event) => goToAppointmentStep(event, "identity")}
        className="min-h-11 flex-1 items-center justify-center rounded-full border border-ink/20 px-5 text-sm font-semibold text-ink transition-colors hover:border-teal hover:text-teal focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal"
      >
        Back
      </button>
      <button
        data-mobile-nav-step
        data-show-on-step="visit"
        type="button"
        onClick={(event) => goToAppointmentStep(event, "identity")}
        className="min-h-11 flex-1 items-center justify-center rounded-full border border-ink/20 px-5 text-sm font-semibold text-ink transition-colors hover:border-teal hover:text-teal focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal"
      >
        Continue <span aria-hidden="true">→</span>
      </button>
      <button
        data-mobile-nav-step
        data-show-on-step="identity"
        type="button"
        onClick={(event) => goToAppointmentStep(event, "coverage")}
        className="min-h-11 flex-1 items-center justify-center rounded-full border border-ink/20 px-5 text-sm font-semibold text-ink transition-colors hover:border-teal hover:text-teal focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal"
      >
        Continue <span aria-hidden="true">→</span>
      </button>
      <button
        data-mobile-nav-step
        data-show-on-step="coverage"
        type="submit"
        disabled={isPending}
        className="min-h-11 flex-1 items-center justify-center rounded-full bg-teal px-5 text-sm font-semibold text-cream shadow-lg shadow-teal/20 transition-colors hover:bg-teal-dark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal disabled:cursor-not-allowed disabled:opacity-70"
      >
        {isPending ? "Sending request…" : "Submit for verification"}
      </button>
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
  const errorFields = Object.keys(errors) as AppointmentField[];
  const requestedStep: MobileStep | undefined =
    state.status !== "error"
      ? undefined
      : errorFields.some((field) => visitFields.includes(field))
        ? "visit"
        : errorFields.some((field) => identityFields.includes(field))
          ? "identity"
          : "coverage";
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
          . Front desk will verify your ID or HMO card. Once approved, the slot
          is confirmed automatically.
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

      <AppointmentStepLayout requestedStep={requestedStep}>
      <AppointmentMobileProgress />

      <section
        className="space-y-5"
        data-booking-panel="visit"
        data-show-from-tablet="true"
      >
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
              onClick={openDatePicker}
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
        activeSection="all"
        showAllFromTablet
        coverageType={coverageType}
        coverageControlled
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

      <AppointmentMobileNavigation isPending={isPending} />

      <div data-booking-desktop-submit className="hidden md:block">
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
      </AppointmentStepLayout>
    </form>
  );
}
