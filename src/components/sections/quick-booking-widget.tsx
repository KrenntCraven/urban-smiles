"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useEffect, useRef, useState, useTransition } from "react";
import { useForm, useWatch } from "react-hook-form";
import { submitAppointment } from "@/lib/booking/actions";
import { initialAppointmentState } from "@/lib/booking/form-state";
import {
  appointmentSchema,
  clinicToday,
  LOCATIONS,
  TIME_SLOTS,
  type AppointmentField,
  type AppointmentInput,
  type LocationId,
} from "@/lib/booking/schema";
import type { ServiceOption } from "@/lib/services/types";

export type BookingDentistOption = {
  slug: string;
  name: string;
  credential: string;
  role: string;
  branchId: LocationId;
  defaultServiceSlug: string;
};

const steps = ["BRANCH", "SERVICE", "DATETIME", "DETAILS"] as const;
type BookingStep = (typeof steps)[number];

const stepLabels: Record<BookingStep, string> = {
  BRANCH: "Branch",
  SERVICE: "Care",
  DATETIME: "Date & time",
  DETAILS: "Your details",
};

const stepFields: Record<BookingStep, AppointmentField[]> = {
  BRANCH: ["locationId"],
  SERVICE: ["serviceSlug", "dentistSlug"],
  DATETIME: ["preferredDate", "preferredTime"],
  DETAILS: ["fullName", "email", "phone", "isNewPatient"],
};

const inputClass =
  "min-h-11 w-full rounded-xl border border-ink/15 bg-cream px-4 py-3 text-base text-ink transition-colors placeholder:text-muted/70 focus-visible:border-teal focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal sm:text-sm";

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
  const [step, setStep] = useState<BookingStep>("BRANCH");
  const [serverState, setServerState] = useState(initialAppointmentState);
  const [isPending, startTransition] = useTransition();
  const dateRef = useRef<HTMLInputElement>(null);

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
      fullName: "",
      email: "",
      phone: "",
      isNewPatient: true,
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

  useEffect(() => {
    if (dateRef.current) dateRef.current.min = clinicToday();
  }, []);

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
      if (requestedDate) setValue("preferredDate", requestedDate);
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

  const onSubmit = handleSubmit((data) => {
    const formData = new FormData();
    for (const [key, value] of Object.entries(data)) {
      if (value === undefined || value === "") continue;
      if (key === "isNewPatient") {
        if (value) formData.set(key, "on");
        continue;
      }
      formData.set(key, String(value));
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
        if (firstInvalidStep) setStep(firstInvalidStep);
      }
    });
  });

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
              Request received
            </h2>
            <p className="mt-3 leading-relaxed text-muted">
              Reference{" "}
              <span className="font-semibold text-ink tabular-nums">
                {serverState.reference}
              </span>
              . Our team will text you within one business hour to confirm the
              slot.
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
              Request your visit in four steps.
            </h2>
            <p className="mt-6 max-w-xl leading-relaxed text-muted">
              Choose where and when you would like to come in. We will confirm
              the appointment by SMS within one business hour.
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
              className="grid grid-cols-4 border-b border-ink/10 bg-sand/40"
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
                      className={`mt-2 hidden text-xs font-semibold sm:block ${
                        isCurrent ? "text-ink" : "text-muted"
                      }`}
                    >
                      {stepLabels[item]}
                    </span>
                  </li>
                );
              })}
            </ol>

            <div className="min-h-96 p-6 sm:p-8">
              <AnimatePresence mode="wait" initial={false}>
                <motion.div
                  key={step}
                  initial={reduceMotion ? false : { opacity: 0, x: 18 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={reduceMotion ? undefined : { opacity: 0, x: -18 }}
                  transition={{ duration: reduceMotion ? 0 : 0.24 }}
                >
                  <p className="text-xs font-semibold tracking-[0.18em] text-teal uppercase">
                    Step {currentIndex + 1} of {steps.length}
                  </p>
                  <h3 className="mt-2 font-display text-2xl font-semibold text-ink">
                    {step === "BRANCH" && "Choose a branch"}
                    {step === "SERVICE" && "Choose your care"}
                    {step === "DATETIME" && "Choose a date and time"}
                    {step === "DETAILS" && "Tell us how to reach you"}
                  </h3>

                  {step === "BRANCH" && (
                    <fieldset className="mt-7">
                      <legend className="sr-only">Urban Smiles branch</legend>
                      <div className="grid gap-3 sm:grid-cols-2">
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
                        <p className="mt-3 text-sm text-teal-dark" role="alert">
                          {errors.locationId.message}
                        </p>
                      )}
                    </fieldset>
                  )}

                  {step === "SERVICE" && (
                    <div className="mt-7 space-y-6">
                      <fieldset>
                        <legend className="text-sm font-medium text-ink">
                          Treatment
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
                          <p
                            className="mt-3 text-sm text-teal-dark"
                            role="alert"
                          >
                            {errors.serviceSlug.message}
                          </p>
                        )}
                      </fieldset>

                      <div>
                        <label
                          htmlFor="quick-booking-dentist"
                          className="text-sm font-medium text-ink"
                        >
                          Preferred dentist{" "}
                          <span className="text-muted">(optional)</span>
                        </label>
                        <select
                          id="quick-booking-dentist"
                          value={values.dentistSlug ?? ""}
                          onChange={(event) =>
                            chooseDentist(event.currentTarget.value)
                          }
                          className={`${inputClass} mt-2`}
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
                        {selectedDentist && (
                          <p className="mt-2 text-xs text-muted">
                            Selecting {selectedDentist.name} also selects their
                            branch and usual treatment.
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  {step === "DATETIME" && (
                    <div className="mt-7 grid gap-5 sm:grid-cols-2">
                      <div>
                        <label
                          htmlFor="quick-booking-date"
                          className="mb-1.5 block text-sm font-medium text-ink"
                        >
                          Preferred date
                        </label>
                        <input
                          id="quick-booking-date"
                          type="date"
                          className={`${inputClass} tabular-nums`}
                          aria-invalid={Boolean(errors.preferredDate)}
                          {...preferredDateField}
                          ref={(node) => {
                            preferredDateField.ref(node);
                            dateRef.current = node;
                          }}
                        />
                        {errors.preferredDate && (
                          <p
                            className="mt-1.5 text-xs text-teal-dark"
                            role="alert"
                          >
                            {errors.preferredDate.message}
                          </p>
                        )}
                      </div>
                      <div>
                        <label
                          htmlFor="quick-booking-time"
                          className="mb-1.5 block text-sm font-medium text-ink"
                        >
                          Preferred time
                        </label>
                        <select
                          id="quick-booking-time"
                          className={`${inputClass} tabular-nums`}
                          aria-invalid={Boolean(errors.preferredTime)}
                          {...register("preferredTime")}
                        >
                          <option value="">Select a time</option>
                          {TIME_SLOTS.map((slot) => (
                            <option key={slot} value={slot}>
                              {slot}
                            </option>
                          ))}
                        </select>
                        {errors.preferredTime && (
                          <p
                            className="mt-1.5 text-xs text-teal-dark"
                            role="alert"
                          >
                            {errors.preferredTime.message}
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  {step === "DETAILS" && (
                    <div className="mt-7 space-y-5">
                      <div>
                        <label
                          htmlFor="quick-booking-name"
                          className="mb-1.5 block text-sm font-medium text-ink"
                        >
                          Full name
                        </label>
                        <input
                          id="quick-booking-name"
                          type="text"
                          autoComplete="name"
                          className={inputClass}
                          aria-invalid={Boolean(errors.fullName)}
                          {...register("fullName")}
                        />
                        {errors.fullName && (
                          <p
                            className="mt-1.5 text-xs text-teal-dark"
                            role="alert"
                          >
                            {errors.fullName.message}
                          </p>
                        )}
                      </div>

                      <div className="grid gap-5 sm:grid-cols-2">
                        <div>
                          <label
                            htmlFor="quick-booking-email"
                            className="mb-1.5 block text-sm font-medium text-ink"
                          >
                            Email
                          </label>
                          <input
                            id="quick-booking-email"
                            type="email"
                            autoComplete="email"
                            className={inputClass}
                            aria-invalid={Boolean(errors.email)}
                            {...register("email")}
                          />
                          {errors.email && (
                            <p
                              className="mt-1.5 text-xs text-teal-dark"
                              role="alert"
                            >
                              {errors.email.message}
                            </p>
                          )}
                        </div>
                        <div>
                          <label
                            htmlFor="quick-booking-phone"
                            className="mb-1.5 block text-sm font-medium text-ink"
                          >
                            Mobile number
                          </label>
                          <input
                            id="quick-booking-phone"
                            type="tel"
                            inputMode="tel"
                            autoComplete="tel"
                            placeholder="09171234567"
                            className={inputClass}
                            aria-invalid={Boolean(errors.phone)}
                            {...register("phone")}
                          />
                          {errors.phone && (
                            <p
                              className="mt-1.5 text-xs text-teal-dark"
                              role="alert"
                            >
                              {errors.phone.message}
                            </p>
                          )}
                        </div>
                      </div>

                      <label className="flex min-h-11 items-center gap-3 rounded-xl text-sm text-muted">
                        <input
                          type="checkbox"
                          className="size-5 shrink-0 rounded border-ink/25 text-teal focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal"
                          {...register("isNewPatient")}
                        />
                        This is my first visit to Urban Smiles
                      </label>

                      <div className="rounded-2xl bg-sand/40 p-4">
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
                            : ""}.
                        </p>
                      </div>
                    </div>
                  )}
                </motion.div>
              </AnimatePresence>
            </div>

            {serverState.formError && (
              <p className="px-6 text-sm text-teal-dark sm:px-8" role="alert">
                {serverState.formError}
              </p>
            )}

            <div className="flex flex-col-reverse gap-3 border-t border-ink/10 bg-sand/20 p-6 sm:flex-row sm:items-center sm:justify-between sm:px-8">
              <button
                type="button"
                onClick={goBack}
                disabled={currentIndex === 0 || isPending}
                className="inline-flex min-h-11 items-center justify-center rounded-full border border-ink/20 px-6 text-sm font-semibold text-ink transition-colors hover:border-teal hover:text-teal focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal disabled:cursor-not-allowed disabled:opacity-40"
              >
                Back
              </button>

              {step === "DETAILS" ? (
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
                      "Confirm Booking Request"
                    )}
                  </button>
                  <p className="mt-2 text-center text-xs text-muted sm:text-right">
                    No payment today
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
