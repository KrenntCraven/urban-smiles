export type ServiceCategory =
  | "preventive"
  | "restorative"
  | "cosmetic"
  | "orthodontics"
  | "surgical";

export interface ProcedureStep {
  title: string;
  description: string;
  durationMinutes?: number;
}

export interface ServiceFaq {
  question: string;
  answer: string;
}

export interface ServicePricing {
  currency: "PHP";
  from: number;
  to?: number;
  /** Qualifier shown after the amount, e.g. "per tooth". */
  unit?: string;
  note?: string;
}

export interface ServiceDuration {
  minMinutes: number;
  maxMinutes: number;
  visits: number;
}

export interface Service {
  slug: string;
  name: string;
  category: ServiceCategory;
  tagline: string;
  detailedOverview: string[];
  highlights: string[];
  recommendedFor: string[];
  procedureSteps: ProcedureStep[];
  pricing: ServicePricing;
  duration: ServiceDuration;
  faqs: ServiceFaq[];
  relatedSlugs: string[];
}

/** Minimal shape passed to client components so the full catalog stays server-side. */
export interface ServiceOption {
  slug: string;
  name: string;
}

export const serviceCategoryLabels: Record<ServiceCategory, string> = {
  preventive: "Preventive Care",
  restorative: "Restorative",
  cosmetic: "Cosmetic",
  orthodontics: "Orthodontics",
  surgical: "Oral Surgery",
};
