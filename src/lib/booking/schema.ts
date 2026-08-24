import { z } from "zod";

/**
 * Public appointment contract — the single source of truth for every booking
 * form (home widget, /book, service CTA). The server action validates against
 * this schema; HTML `min`/`pattern` are convenience only.
 *
 * Covers visit (service, branch, date/time), identity (Pascal-case names),
 * PH mobile + email, HMO vs self-pay, and privacy consent.
 */
export const LOCATIONS = [
  { id: "bgc", name: "BGC — High Street" },
  { id: "makati", name: "Makati — Legazpi Village" },
  { id: "ortigas", name: "Ortigas — Emerald Avenue" },
  { id: "qc", name: "Quezon City — Katipunan" },
] as const;

export type LocationId = (typeof LOCATIONS)[number]["id"];

export const LOCATION_IDS = LOCATIONS.map((location) => location.id) as [
  string,
  ...string[],
];

export const TIME_SLOTS = [
  "09:00",
  "10:00",
  "11:00",
  "13:00",
  "14:00",
  "15:00",
  "16:00",
  "17:00",
] as const;

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

const manilaDateFormatter = new Intl.DateTimeFormat("en-CA", {
  timeZone: "Asia/Manila",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

/** Today in clinic time as `YYYY-MM-DD`, so ISO date strings compare lexicographically. */
export function clinicToday(): string {
  return manilaDateFormatter.format(new Date());
}

/**
 * Greys out past days in the native picker. Applied through a ref rather than
 * rendered, because the home page is static HTML: a build-time "today" would be
 * stale by the next morning.
 */
export function bindClinicDateMin(input: HTMLInputElement | null) {
  if (!input) return;
  // Re-assigning `min` discards half-typed segments, and the home widget
  // re-renders on every keystroke, so only write it when it actually changes.
  const min = clinicToday();
  if (input.min !== min) input.min = min;
}

const TIME_24H = /^([01]\d|2[0-3]):[0-5]\d$/;

/** Philippine mobile: 09171234567 or +639171234567, after separators are stripped. */
export const PH_MOBILE = /^(?:\+63|0)9\d{9}$/;
/** Practical contact email — local@domain.tld, no spaces. */
export const CONTACT_EMAIL = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;

export const contactMessages = {
  phone: "Use a mobile number like 09171234567.",
  email: "Enter a valid email address.",
} as const;

export function normalizePhMobile(value: string): string {
  const compact = value.replace(/[\s()-]/g, "");
  if (/^639\d{9}$/.test(compact)) return `+${compact}`;
  if (/^9\d{9}$/.test(compact)) return `0${compact}`;
  return compact;
}

export function phoneError(value: string): string | undefined {
  return PH_MOBILE.test(normalizePhMobile(value))
    ? undefined
    : contactMessages.phone;
}

export function emailError(value: string, required = true): string | undefined {
  const email = value.trim();
  if (!email) return required ? contactMessages.email : undefined;
  return CONTACT_EMAIL.test(email) ? undefined : contactMessages.email;
}

export const NAME_SUFFIXES = ["Jr.", "Sr.", "II", "III", "IV"] as const;
export type NameSuffix = (typeof NAME_SUFFIXES)[number];

/**
 * Normalises a typed name to Pascal case: "JUAN DELA CRUZ" and "juan dela cruz"
 * both become "Juan Dela Cruz". Word boundaries include hyphens and apostrophes
 * so "anne-marie" and "o'brien" keep their internal capitals.
 */
export function toNameCase(value: string): string {
  return value
    .replace(/\s+/g, " ")
    .trim()
    .toLocaleLowerCase()
    .replace(
      /(^|[\s\-'’])(\p{L})/gu,
      (_match, boundary: string, letter: string) =>
        boundary + letter.toLocaleUpperCase(),
    );
}

export const HMO_PROVIDERS = [
  "Maxicare",
  "Intellicare",
  "Medicard",
  "PhilCare",
  "Cocolife",
  "EastWest Healthcare",
  "Avega",
  "Other",
] as const;
export type HmoProvider = (typeof HMO_PROVIDERS)[number];

export const COVERAGE_TYPES = ["hmo", "self-pay"] as const;
export type CoverageType = (typeof COVERAGE_TYPES)[number];

export const BOOKING_CHANNELS = ["website", "messenger"] as const;
export type BookingChannel = (typeof BOOKING_CHANNELS)[number];

export const appointmentSchema = z
  .object({
    serviceSlug: z.string().min(1, { error: "Choose a service." }),
    dentistSlug: z.string().trim().min(1).optional(),
    firstName: z
      .string()
      .trim()
      .min(1, { error: "Enter your first name." })
      .max(40, { error: "That name is too long." })
      .transform(toNameCase),
    middleName: z.string().trim().max(40).transform(toNameCase).optional(),
    noMiddleName: z.boolean(),
    surname: z
      .string()
      .trim()
      .min(1, { error: "Enter your surname." })
      .max(40, { error: "That name is too long." })
      .transform(toNameCase),
    suffix: z.enum(NAME_SUFFIXES).optional(),
    email: z.string().trim().optional(),
    phone: z
      .string()
      .trim()
      .transform(normalizePhMobile)
      .refine((value) => PH_MOBILE.test(value), {
        error: contactMessages.phone,
      }),
    locationId: z.enum(LOCATION_IDS, { error: "Choose a branch." }),
    preferredDate: z
      .string()
      .regex(ISO_DATE, { error: "Choose a preferred date." })
      .refine((value) => value >= clinicToday(), {
        error: "Pick today or a later date.",
      }),
    preferredTime: z
      .string()
      .regex(TIME_24H, { error: "Choose a preferred time." }),
    coverageType: z.enum(COVERAGE_TYPES, {
      error: "Choose how you will pay for this visit.",
    }),
    hmoProvider: z.enum(HMO_PROVIDERS).optional(),
    hmoMemberId: z.string().trim().max(40).optional(),
    privacyConsent: z.boolean().refine((value) => value === true, {
      error:
        "Consent is required before we can store your ID or HMO information.",
    }),
    isNewPatient: z.boolean(),
    notes: z
      .string()
      .trim()
      .max(500, { error: "Please keep notes under 500 characters." })
      .optional(),
    channel: z.enum(BOOKING_CHANNELS),
  })
  .superRefine((value, context) => {
    if (value.noMiddleName) {
      if (value.middleName) {
        context.addIssue({
          code: "custom",
          path: ["middleName"],
          message: "Clear the middle name, or turn off “No middle name”.",
        });
      }
    } else if (!value.middleName) {
      context.addIssue({
        code: "custom",
        path: ["middleName"],
        message: "Enter your middle name, or choose “No middle name”.",
      });
    }

    if (value.channel === "website") {
      const message = emailError(value.email ?? "");
      if (message) {
        context.addIssue({
          code: "custom",
          path: ["email"],
          message,
        });
      }
    }

    if (value.coverageType === "hmo") {
      if (!value.hmoProvider) {
        context.addIssue({
          code: "custom",
          path: ["hmoProvider"],
          message: "Choose your HMO provider.",
        });
      }
      if (!value.hmoMemberId) {
        context.addIssue({
          code: "custom",
          path: ["hmoMemberId"],
          message: "Enter your HMO member ID.",
        });
      }
    }
  });

export type AppointmentInput = z.infer<typeof appointmentSchema>;
export type AppointmentField = keyof AppointmentInput;

/**
 * Shape of the `/book` query string. Every field is independently recoverable —
 * a malformed `date` must not discard a valid `service`.
 */
export const bookingPrefillSchema = z.object({
  service: z.string().trim().min(1).optional().catch(undefined),
  dentist: z.string().trim().min(1).optional().catch(undefined),
  id: z.string().trim().min(1).optional().catch(undefined),
  date: z.string().regex(ISO_DATE).optional().catch(undefined),
  time: z.string().regex(TIME_24H).optional().catch(undefined),
  location: z.enum(LOCATION_IDS).optional().catch(undefined),
});

export type BookingPrefill = z.infer<typeof bookingPrefillSchema>;

export function parseBookingPrefill(input: unknown): BookingPrefill {
  const result = bookingPrefillSchema.safeParse(input);
  return result.success ? result.data : {};
}

export function toAppointmentDefaults(
  prefill: BookingPrefill,
): Partial<AppointmentInput> {
  const today = clinicToday();
  return {
    serviceSlug: prefill.service,
    dentistSlug: prefill.dentist ?? prefill.id,
    preferredDate:
      prefill.date && prefill.date >= today ? prefill.date : undefined,
    preferredTime: prefill.time,
    locationId: prefill.location,
  };
}

export function buildBookingHref(prefill: BookingPrefill): string {
  const params = new URLSearchParams();
  if (prefill.service) params.set("service", prefill.service);
  if (prefill.dentist) params.set("dentist", prefill.dentist);
  if (prefill.date) params.set("date", prefill.date);
  if (prefill.time) params.set("time", prefill.time);
  if (prefill.location) params.set("location", prefill.location);

  const query = params.toString();
  return query ? `/book?${query}` : "/book";
}

/** Deep-link to the embedded home-page wizard with the same prefill contract. */
export function buildQuickBookingHref(prefill: BookingPrefill): string {
  const fullPageHref = buildBookingHref(prefill);
  const query = fullPageHref.split("?")[1];
  return query ? `/?${query}#book` : "/#book";
}

export function getLocationName(id: string | undefined): string | undefined {
  return LOCATIONS.find((location) => location.id === id)?.name;
}

export function formatPatientName(
  appointment: Pick<
    AppointmentInput,
    "firstName" | "middleName" | "noMiddleName" | "surname" | "suffix"
  >,
): string {
  const middle = appointment.noMiddleName ? undefined : appointment.middleName;
  return [
    appointment.firstName,
    middle,
    appointment.surname,
    appointment.suffix,
  ]
    .filter(Boolean)
    .join(" ");
}
