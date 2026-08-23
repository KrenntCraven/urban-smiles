"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useEffect, useState, useTransition } from "react";
import { useForm, useWatch } from "react-hook-form";
import { submitAppointment } from "@/lib/booking/actions";
import { initialAppointmentState } from "@/lib/booking/form-state";
import {
  appointmentSchema,
  bindClinicDateMin,
  clinicToday,
  LOCATIONS,
  TIME_SLOTS,
  toNameCase,
  type AppointmentField,
  type AppointmentInput,
  type LocationId,
} from "@/lib/booking/schema";
import { PatientVerificationFields } from "@/components/booking/patient-fields";
import {
  Field,
  fieldCopy,
  inputClass,
  openDatePicker,
} from "@/components/booking/field";
import type { ServiceOption } from "@/lib/services/types";

export type BookingDentistOption = {
  slug: string;
  name: string;
  credential: string;
  role: string;
  branchId: LocationId;
  defaultServiceSlug: string;
};

const steps = ["VISIT", "IDENTITY", "COVERAGE"] as const;
type BookingStep = (typeof steps)[number];

const stepLabels: Record<BookingStep, string> = {
  VISIT: "Visit",
  IDENTITY: "You",
  COVERAGE: "Coverage",
};

const stepFields: Record<BookingStep, AppointmentField[]> = {
  VISIT: [
    "locationId",
    "serviceSlug",
    "dentistSlug",
    "preferredDate",
    "preferredTime",
  ],
  IDENTITY: [
    "firstName",
    "middleName",
    "noMiddleName",
    "surname",
    "suffix",
    "email",
    "phone",
  ],
  COVERAGE: [
    "coverageType",
    "hmoProvider",
    "hmoMemberId",
    "privacyConsent",
  ],
};

function resolveDentist(
  value: string | null,
  dentists: readonly BookingDentistOption[],
) {
  if (!value) return undefined;
  const normalized = value.trim().toLowerCase();
  return dentists.find(
    (dentist) =>
      dentist.slug === normalized ||
      dentist.slug.split("-")[0] === normalized,
  );
}

function inferredServiceFromPath(pathname: string) {
  const match = pathname.match(/^\/services\/([^/]+)\/?$/);
  return match?.[1];
}

export function QuickBookingWidget({
  services,
  dentists,
}: {
  services: readonly ServiceOption[];
  dentists: readonly BookingDentistOption[];
}) {
  const reduceMotion = useReducedMotion();
  const [step, setStep] = useState<BookingStep>("VISIT");
  const [serverState, setServerState] = useState(initialAppointmentState);
  const [isPending, startTransition] = useTransition();

  const {
    register,
    setValue,
    setError,
    trigger,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<AppointmentInput>({
    resolver: zodResolver(appointmentSchema),
    defaultValues: {
      firstName: "",
      surname: "",
      email: "",
      phone: "",
      noMiddleName: false,
      privacyConsent: false,
      isNewPatient: true,
      channel: "website",
      coverageType: "self-pay",
    },
    mode: "onTouched",
    shouldUnregister: false,
  });

  const values = useWatch({ control });
  const currentIndex = steps.indexOf(step);
  const selectedDentist = dentists.find(
    (dentist) => dentist.slug === values.dentistSlug,
  );
  const selectedService = services.find(
    (service) => service.slug === values.serviceSlug,
  );
  const preferredDateField = register("preferredDate");

  // Field renders its error as `${htmlFor}-error`, so inputs point at that id.
  const describedBy = (id: string, message?: string) =>
    message ? `${id}-error` : undefined;

  // Mirrors the transform in appointmentSchema so the patient sees the stored
  // spelling before submitting, not after.
  const nameField = (name: "firstName" | "middleName" | "surname") =>
    register(name, {
      onBlur: (event) => {
        const cased = toNameCase(event.target.value);
        if (cased !== event.target.value) {
          setValue(name, cased, { shouldValidate: true });
        }
      },
    });

  // Read the browser URL after hydration so the full section remains in the
  // server-rendered HTML. Explicit query parameters are the durable contract;
  // a same-origin referrer is only a fallback for older internal links.
  useEffect(() => {
    try {
      const current = new URL(window.location.href);
      let source = current;
      const hasExplicitPrefill = [
        "service",
        "dentist",
        "id",
        "location",
        "date",
        "time",
      ].some((key) => current.searchParams.has(key));

      if (!hasExplicitPrefill && document.referrer) {
        const referrer = new URL(document.referrer);
        if (referrer.origin === current.origin) source = referrer;
      }

      const dentist = resolveDentist(
        source.searchParams.get("dentist") ?? source.searchParams.get("id"),
        dentists,
      );
      if (dentist) {
        setValue("dentistSlug", dentist.slug);
        setValue("locationId", dentist.branchId);
        setValue("serviceSlug", dentist.defaultServiceSlug);
      }

      const requestedService =
        source.searchParams.get("service") ??
        inferredServiceFromPath(source.pathname);
      if (
        requestedService &&
        services.some((service) => service.slug === requestedService)
      ) {
        setValue("serviceSlug", requestedService);
      }

      const requestedLocation = source.searchParams.get("location");
      if (
        LOCATIONS.some((location) => location.id === requestedLocation)
      ) {
        setValue("locationId", requestedLocation as LocationId);
      }

      const requestedDate = source.searchParams.get("date");
      const requestedTime = source.searchParams.get("time");
      if (requestedDate && requestedDate >= clinicToday()) {
        setValue("preferredDate", requestedDate);
      }
      if (requestedTime) setValue("preferredTime", requestedTime);
    } catch {
      // Invalid or privacy-stripped referrers simply leave the form unprefilled.
    }
  }, [dentists, services, setValue]);

  const goNext = async () => {
    const valid = await trigger(stepFields[step], { shouldFocus: true });
    if (valid && currentIndex < steps.length - 1) {
      setStep(steps[currentIndex + 1]);
    }
  };

  const goBack = () => {
    if (currentIndex > 0) setStep(steps[currentIndex - 1]);
  };

  const chooseDentist = (slug: string) => {
    const dentist = dentists.find((item) => item.slug === slug);
    setValue("dentistSlug", slug || undefined, { shouldValidate: true });
    if (!dentist) return;
    setValue("locationId", dentist.branchId, { shouldValidate: true });
    setValue("serviceSlug", dentist.defaultServiceSlug, {
      shouldValidate: true,
    });
  };

  const onSubmit = handleSubmit(
    (data, event) => {
      const formData = new FormData();
      formData.set("channel", "website");

      for (const [key, value] of Object.entries(data)) {
        if (value === undefined || value === "") continue;
        if (
          key === "isNewPatient" ||
          key === "noMiddleName" ||
          key === "privacyConsent"
        ) {
          if (value) formData.set(key, "on");
          continue;
        }
        formData.set(key, String(value));
      }

      const native = event?.target;
      if (native instanceof HTMLFormElement) {
        for (const kind of ["hmoCardFront", "hmoCardBack", "governmentId"]) {
          const input = native.elements.namedItem(kind);
          if (input instanceof HTMLInputElement && input.files?.[0]) {
            formData.set(kind, input.files[0]);
          }
        }
      }

      startTransition(async () => {
        const result = await submitAppointment(initialAppointmentState, formData);
        setServerState(result);

        if (result.status === "error") {
          for (const [field, message] of Object.entries(result.fieldErrors)) {
            if (message) {
              setError(field as AppointmentField, {
                type: "server",
                message,
              });
            }
          }
          const firstInvalidStep = steps.find((candidate) =>
            stepFields[candidate].some(
              (field) => result.fieldErrors[field] !== undefined,
            ),
          );
          if (Object.keys(result.documentErrors ?? {}).length > 0) {
            setStep("COVERAGE");
          } else if (firstInvalidStep) {
            setStep(firstInvalidStep);
          }
        }
      });
    },
    (invalidFields) => {
      const firstInvalidStep = steps.find((candidate) =>
        stepFields[candidate].some((field) => invalidFields[field] !== undefined),
      );
      if (firstInvalidStep) setStep(firstInvalidStep);
    },
  );

  if (serverState.status === "success") {
    return (
      <section id="book" className="bg-cream">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20 lg:py-28">
          <div className="mx-auto max-w-2xl rounded-[2rem] bg-mint/40 p-8 text-center ring-1 ring-teal/20 sm:p-12">
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
            <h2 className="mt-5 font-display text-3xl font-semibold text-ink">
              Pending verification
            </h2>
            <p className="mt-3 leading-relaxed text-muted">
              Reference{" "}
              <span className="font-semibold text-ink tabular-nums">
                {serverState.reference}
              </span>
              . Front desk will review your ID or HMO card, then text you to
              confirm the slot.
            </p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section id="book" className="bg-cream">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20 lg:py-28">
        <div className="grid gap-10 lg:grid-cols-[0.75fr_1.25fr] lg:items-start lg:gap-16">
          <div>
            <p className="flex items-center gap-3 text-xs font-semibold tracking-[0.28em] text-teal uppercase">
              <span aria-hidden="true" className="h-px w-8 bg-teal/40" />
              Quick Booking
            </p>
            <h2 className="mt-5 font-display text-3xl leading-[1.1] font-semibold tracking-[0.01em] text-ink uppercase sm:text-4xl lg:text-5xl">
              Request your visit in three short steps.
            </h2>
            <p className="mt-6 max-w-xl leading-relaxed text-muted">
              Pick the slot, tell us who you are, then send your coverage
              details. Front desk reviews the same complete request before
              confirming by SMS.
            </p>

            <p className="mt-8 rounded-2xl bg-mint/40 p-5 text-sm leading-relaxed text-muted ring-1 ring-teal/20">
              Arriving from a treatment or dentist profile? We carry those
              choices into this form automatically, and you can still change
              them.
            </p>
          </div>

          <form
            onSubmit={onSubmit}
            noValidate
            className="overflow-hidden rounded-[2rem] bg-cream shadow-xl shadow-ink/5 ring-1 ring-ink/10"
          >
            <ol
              aria-label="Booking progress"
              className="grid grid-cols-3 border-b border-ink/10 bg-sand/40"
            >
              {steps.map((item, index) => {
                const isCurrent = item === step;
                const isComplete = index < currentIndex;
                return (
                  <li
                    key={item}
                    aria-current={isCurrent ? "step" : undefined}
                    className="relative px-2 py-4 text-center sm:px-4"
                  >
                    <span
                      className={`mx-auto flex size-8 items-center justify-center rounded-full text-xs font-semibold tabular-nums ${
                        isCurrent
                          ? "bg-teal text-cream"
                          : isComplete
                            ? "bg-mint text-teal"
                            : "bg-cream text-muted ring-1 ring-ink/10"
                      }`}
                    >
                      {isComplete ? "✓" : index + 1}
                    </span>
                    <span
                      className={`mt-2 block text-[0.6875rem] font-semibold sm:text-xs ${
                        isCurrent ? "text-ink" : "text-muted"
                      }`}
                    >
                      {stepLabels[item]}
                    </span>
                  </li>
                );
              })}
            </ol>

            <div className="min-h-96 px-5 py-6 sm:p-8">
              <AnimatePresence mode="wait" initial={false}>
                <motion.div
                  key={step === "VISIT" ? "VISIT" : "VERIFICATION"}
                  initial={reduceMotion ? false : { opacity: 0, x: 18 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={reduceMotion ? undefined : { opacity: 0, x: -18 }}
                  transition={{ duration: reduceMotion ? 0 : 0.24 }}
                >
                  <p className="text-xs font-semibold tracking-[0.18em] text-teal uppercase">
                    Step {currentIndex + 1} of {steps.length}
                  </p>
                  <h3 className="mt-2 font-display text-2xl font-semibold text-ink">
                    {step === "VISIT" && "Choose your visit"}
                    {step === "IDENTITY" && "Tell us who you are"}
                    {step === "COVERAGE" && "Verify your coverage"}
                  </h3>

                  {step === "VISIT" && (
                    <div className="mt-7 space-y-8">
                      <fieldset>
                        <legend className="text-sm font-medium text-ink">
                          {fieldCopy.locationId.label}
                        </legend>
                        <div className="mt-2 grid gap-3 sm:grid-cols-2">
                          {LOCATIONS.map((location) => (
                            <label
                              key={location.id}
                              className={`flex min-h-20 cursor-pointer items-center rounded-2xl p-4 ring-1 transition-colors ${
                                values.locationId === location.id
                                  ? "bg-mint/40 ring-teal"
                                  : "bg-cream ring-ink/10 hover:ring-teal/50"
                              }`}
                            >
                              <input
                                type="radio"
                                value={location.id}
                                className="sr-only"
                                {...register("locationId")}
                              />
                              <span>
                                <span className="block font-semibold text-ink">
                                  {location.name.split(" — ")[0]}
                                </span>
                                <span className="mt-1 block text-sm text-muted">
                                  {location.name.split(" — ")[1]}
                                </span>
                              </span>
                            </label>
                          ))}
                        </div>
                        {errors.locationId && (
                          <p className="mt-3 text-xs text-teal-dark" role="alert">
                            {errors.locationId.message}
                          </p>
                        )}
                      </fieldset>

                      <fieldset>
                        <legend className="text-sm font-medium text-ink">
                          {fieldCopy.serviceSlug.label}
                        </legend>
                        <div className="mt-2 grid gap-3 sm:grid-cols-2">
                          {services.map((service) => (
                            <label
                              key={service.slug}
                              className={`flex min-h-16 cursor-pointer items-center rounded-2xl p-4 text-sm font-semibold ring-1 transition-colors ${
                                values.serviceSlug === service.slug
                                  ? "bg-mint/40 text-ink ring-teal"
                                  : "bg-cream text-ink ring-ink/10 hover:ring-teal/50"
                              }`}
                            >
                              <input
                                type="radio"
                                value={service.slug}
                                className="sr-only"
                                {...register("serviceSlug")}
                              />
                              {service.name}
                            </label>
                          ))}
                        </div>
                        {errors.serviceSlug && (
                          <p className="mt-3 text-xs text-teal-dark" role="alert">
                            {errors.serviceSlug.message}
                          </p>
                        )}
                      </fieldset>

                      <Field
                        label={fieldCopy.dentistSlug.label}
                        htmlFor="quick-booking-dentist"
                        optional
                        hint={
                          selectedDentist
                            ? `Selecting ${selectedDentist.name} also selects their branch and usual treatment.`
                            : undefined
                        }
                      >
                        <select
                          id="quick-booking-dentist"
                          value={values.dentistSlug ?? ""}
                          onChange={(event) =>
                            chooseDentist(event.currentTarget.value)
                          }
                          className={inputClass}
                        >
                          <option value="">No preference</option>
                          {dentists.map((dentist) => (
                            <option key={dentist.slug} value={dentist.slug}>
                              {dentist.name}, {dentist.credential} —{" "}
                              {dentist.role}
                            </option>
                          ))}
                        </select>
                        <input
                          type="hidden"
                          {...register("dentistSlug", {
                            setValueAs: (value) => value || undefined,
                          })}
                        />
                      </Field>

                      <div className="grid gap-5 sm:grid-cols-2">
                        <Field
                          label={fieldCopy.preferredDate.label}
                          htmlFor="quick-booking-date"
                          error={errors.preferredDate?.message}
                        >
                          <input
                            id="quick-booking-date"
                            type="date"
                            onClick={openDatePicker}
                            className={`${inputClass} tabular-nums`}
                            aria-invalid={Boolean(errors.preferredDate)}
                            aria-describedby={describedBy(
                              "quick-booking-date",
                              errors.preferredDate?.message,
                            )}
                            {...preferredDateField}
                            ref={(node) => {
                              preferredDateField.ref(node);
                              bindClinicDateMin(node);
                            }}
                          />
                        </Field>
                        <Field
                          label={fieldCopy.preferredTime.label}
                          htmlFor="quick-booking-time"
                          error={errors.preferredTime?.message}
                        >
                          <select
                            id="quick-booking-time"
                            className={`${inputClass} tabular-nums`}
                            aria-invalid={Boolean(errors.preferredTime)}
                            aria-describedby={describedBy(
                              "quick-booking-time",
                              errors.preferredTime?.message,
                            )}
                            {...register("preferredTime")}
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
                    </div>
                  )}
                  {step !== "VISIT" && (
                    <div className="mt-7 space-y-8">
                      <div
                        className={
                          step === "IDENTITY"
                            ? "rounded-2xl bg-sand/40 p-4"
                            : "hidden"
                        }
                      >
                        <p className="text-xs font-semibold tracking-[0.18em] text-muted uppercase">
                          Your request
                        </p>
                        <p className="mt-2 text-sm leading-relaxed text-ink">
                          {selectedService?.name} at{" "}
                          {
                            LOCATIONS.find(
                              (location) =>
                                location.id === values.locationId,
                            )?.name
                          }
                          , {values.preferredDate} at {values.preferredTime}
                          {selectedDentist
                            ? ` with ${selectedDentist.name}`
                            : ""}
                          .
                        </p>
                      </div>

                      <PatientVerificationFields
                        Title="h4"
                        idFor={(field) => `quick-booking-${field}`}
                        errors={{
                          firstName: errors.firstName?.message,
                          middleName: errors.middleName?.message,
                          surname: errors.surname?.message,
                          suffix: errors.suffix?.message,
                          email: errors.email?.message,
                          phone: errors.phone?.message,
                          coverageType: errors.coverageType?.message,
                          hmoProvider: errors.hmoProvider?.message,
                          hmoMemberId: errors.hmoMemberId?.message,
                          privacyConsent: errors.privacyConsent?.message,
                        }}
                        documentErrors={serverState.documentErrors}
                        activeSection={
                          step === "IDENTITY" ? "identity" : "coverage"
                        }
                        coverageType={values.coverageType ?? "self-pay"}
                        noMiddleName={Boolean(values.noMiddleName)}
                        firstName={nameField("firstName")}
                        surname={nameField("surname")}
                        middleName={nameField("middleName")}
                        suffix={register("suffix", {
                          setValueAs: (value) => value || undefined,
                        })}
                        phone={register("phone")}
                        email={register("email")}
                        coverageTypeBind={register("coverageType")}
                        hmoProvider={register("hmoProvider", {
                          setValueAs: (value) => value || undefined,
                        })}
                        hmoMemberId={register("hmoMemberId")}
                        noMiddleNameBind={register("noMiddleName", {
                          onChange: (event) => {
                            if (event.currentTarget.checked) {
                              setValue("middleName", "", {
                                shouldValidate: true,
                              });
                            }
                          },
                        })}
                        privacyConsent={register("privacyConsent")}
                        isNewPatient={register("isNewPatient")}
                      />
                    </div>
                  )}
                </motion.div>
              </AnimatePresence>
            </div>

            {serverState.formError && (
              <p className="px-5 text-sm text-teal-dark sm:px-8" role="alert">
                {serverState.formError}
              </p>
            )}

            <div className="flex flex-col-reverse gap-3 border-t border-ink/10 bg-sand/20 px-5 py-6 sm:flex-row sm:items-center sm:justify-between sm:px-8">
              <button
                type="button"
                onClick={goBack}
                disabled={currentIndex === 0 || isPending}
                className="inline-flex min-h-11 items-center justify-center rounded-full border border-ink/20 px-6 text-sm font-semibold text-ink transition-colors hover:border-teal hover:text-teal focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal disabled:cursor-not-allowed disabled:opacity-40"
              >
                Back
              </button>

              {step === "COVERAGE" ? (
                <div className="sm:text-right">
                  <button
                    type="submit"
                    disabled={isPending}
                    className="inline-flex min-h-11 w-full items-center justify-center rounded-full bg-teal px-7 text-base font-semibold text-cream shadow-lg shadow-teal/20 transition-colors hover:bg-teal-dark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal disabled:cursor-not-allowed disabled:opacity-70 sm:w-auto"
                  >
                    {isPending ? (
                      <>
                        <span
                          aria-hidden="true"
                          className="mr-2 size-4 animate-spin rounded-full border-2 border-cream/40 border-t-cream"
                        />
                        Sending request…
                      </>
                    ) : (
                      "Submit for verification"
                    )}
                  </button>
                  <p className="mt-2 text-center text-xs text-muted sm:text-right">
                    Status starts as pending verification
                  </p>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={goNext}
                  className="inline-flex min-h-11 items-center justify-center rounded-full border border-ink/20 px-7 text-base font-semibold text-ink transition-colors hover:border-teal hover:text-teal focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal"
                >
                  Continue
                  <span aria-hidden="true" className="ml-2">
                    →
                  </span>
                </button>
              )}
            </div>
          </form>
        </div>
      </div>
    </section>
  );
}
