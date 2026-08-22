import type { LocationId } from "@/lib/booking/schema";

/**
 * Deliberately narrower than `ServiceCategory`: this vocabulary drives the
 * public filter bar, so every value must be a label a patient would self-select.
 */
export type DentistSpecialty = "cosmetic" | "orthodontics" | "pediatric";

export const dentistSpecialtyLabels: Record<DentistSpecialty, string> = {
  cosmetic: "Cosmetic",
  orthodontics: "Orthodontics",
  pediatric: "Pediatric",
};

/** Filter bar order. Also guarantees a stable tab order across renders. */
export const dentistSpecialtyOrder: DentistSpecialty[] = [
  "cosmetic",
  "orthodontics",
  "pediatric",
];

export interface DentistQualification {
  qualification: string;
  institution: string;
  year: number;
}

export interface OfficeHours {
  days: string;
  hours: string;
}

export interface Dentist {
  slug: string;
  /** Without the credential suffix — the badge renders that separately. */
  name: string;
  credential: string;
  role: string;
  specialties: DentistSpecialty[];
  focusAreas: string[];
  /** Exactly two sentences: the card and the dialog both render it in full. */
  philosophy: string;
  photo: string;
  photoAlt: string;
  practicingSince: number;
  education: DentistQualification[];
  certifications: string[];
  officeHours: OfficeHours[];
  branchId: LocationId;
  /** Pre-selects the treatment when this dentist's booking CTA is used. */
  defaultServiceSlug: string;
}
