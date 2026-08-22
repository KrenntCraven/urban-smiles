import { z } from "zod";

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

const TIME_24H = /^([01]\d|2[0-3]):[0-5]\d$/;
/** Philippine mobile numbers: 09XXXXXXXXX or +639XXXXXXXXX. */
const PH_MOBILE = /^(?:\+63|0)9\d{9}$/;

export const appointmentSchema = z.object({
  serviceSlug: z.string().min(1, { error: "Choose a service." }),
  dentistSlug: z.string().trim().min(1).optional(),
  fullName: z
    .string()
    .trim()
    .min(2, { error: "Enter your full name." })
    .max(80, { error: "That name is too long." }),
  email: z.email({ error: "Enter a valid email address." }),
  phone: z
    .string()
    .trim()
    .regex(PH_MOBILE, { error: "Use a mobile number like 09171234567." }),
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
  isNewPatient: z.boolean(),
  notes: z
    .string()
    .trim()
    .max(500, { error: "Please keep notes under 500 characters." })
    .optional(),
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
  return {
    serviceSlug: prefill.service,
    dentistSlug: prefill.dentist ?? prefill.id,
    preferredDate: prefill.date,
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
