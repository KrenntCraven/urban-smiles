import type { MouseEvent, ReactNode } from "react";
import {
  ACCEPTED_DOCUMENT_TYPES,
  MAX_DOCUMENT_BYTES,
} from "@/lib/booking/files";
import type { DocumentKind } from "@/lib/booking/records";
import {
  HMO_PROVIDERS,
  NAME_SUFFIXES,
  type AppointmentField,
  type CoverageType,
} from "@/lib/booking/schema";

export const inputClass =
  "min-h-11 w-full rounded-xl border border-ink/15 bg-cream px-4 py-3 text-base text-ink transition-colors placeholder:text-muted/70 focus-visible:border-teal focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal sm:text-sm";

/**
 * A file input cannot be sized like a text input — the browser draws the button
 * itself — so the button gets its own 44px target and the filename is allowed
 * to wrap instead of forcing the row wider than a phone screen.
 */
export const fileInputClass =
  "block w-full cursor-pointer rounded-xl border border-ink/15 bg-cream p-2.5 text-sm break-all text-muted transition-colors file:mr-3 file:min-h-11 file:cursor-pointer file:rounded-full file:border-0 file:bg-mint file:px-4 file:text-xs file:font-semibold file:text-teal focus-visible:border-teal focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal";

export const acceptAttribute = ACCEPTED_DOCUMENT_TYPES.join(",");

/**
 * Desktop browsers only open a date field's picker from the small calendar
 * glyph, so tapping the rest of the field looks dead at narrow widths. Mobile
 * already opens on tap and re-opening an open picker is a no-op, so this is
 * safe everywhere; typing into the segments still works.
 */
export function openDatePicker(event: MouseEvent<HTMLInputElement>) {
  const input = event.currentTarget;
  if (typeof input.showPicker !== "function") return;
  try {
    input.showPicker();
  } catch {
    // showPicker throws without user activation or where it is unsupported.
    // The browser's own calendar glyph remains available in that case.
  }
}

export const groupTitleClass =
  "font-display text-lg font-semibold text-ink sm:text-xl";

export const checkboxClass =
  "size-5 shrink-0 rounded border-ink/25 text-teal focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal";

export const checkboxRowClass =
  "flex min-h-11 items-center gap-3 text-sm text-muted";

export const consentRowClass =
  "flex min-h-11 items-start gap-3 text-sm leading-relaxed text-muted";

export function coverageCardClass(selected: boolean) {
  return `flex min-h-14 cursor-pointer items-center rounded-2xl px-4 ring-1 transition-colors ${
    selected ? "bg-mint/40 ring-teal" : "ring-ink/10 hover:ring-teal/50"
  }`;
}

export const COVERAGE_OPTIONS: readonly {
  value: CoverageType;
  label: string;
}[] = [
  { value: "self-pay", label: "Self-pay / no HMO" },
  { value: "hmo", label: "HMO" },
];

/**
 * The home wizard and the /book form ask for the same things in the same
 * order, so the wording lives here rather than in either component.
 */
export const fieldCopy = {
  locationId: { label: "Branch" },
  serviceSlug: { label: "Service" },
  dentistSlug: { label: "Preferred dentist" },
  preferredDate: { label: "Preferred date" },
  preferredTime: { label: "Preferred time" },
  firstName: { label: "First name" },
  middleName: { label: "Middle name" },
  surname: { label: "Surname" },
  suffix: { label: "Suffix" },
  phone: {
    label: "Mobile number",
    hint: "09XXXXXXXXX or +639XXXXXXXXX.",
  },
  email: {
    label: "Email",
    hint: "Required for website bookings — name@example.com.",
  },
  hmoProvider: { label: "HMO provider" },
  hmoMemberId: { label: "HMO member / ID number" },
  hmoCardFront: { label: "HMO card — front" },
  hmoCardBack: { label: "HMO card — back" },
  governmentId: { label: "Government-issued ID" },
} satisfies Record<string, { label: string; hint?: string }>;

export const bookingCopy = {
  visitGroup: "Visit",
  identityGroup: "Identity",
  contactGroup: "Contact",
  coverageQuestion: "How will you be paying for this visit?",
  noMiddleName: "No middle name",
  newPatient: "This is my first visit to Urban Smiles",
  privacyConsent:
    "I consent to Urban Smiles collecting and storing my ID/HMO information for appointment verification purposes, in accordance with the Data Privacy Act of 2012.",
} as const;

export function Field({
  label,
  htmlFor,
  error,
  hint,
  optional,
  children,
  className = "",
}: {
  label: string;
  htmlFor: string;
  error?: string;
  hint?: string;
  optional?: boolean;
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
        {optional ? (
          <span className="font-normal text-muted"> (optional)</span>
        ) : null}
      </label>
      {children}
      {hint && !error ? (
        <p className="mt-1.5 text-xs text-muted">{hint}</p>
      ) : null}
      {error ? (
        <p
          id={`${htmlFor}-error`}
          role="alert"
          className="mt-1.5 text-xs text-teal-dark"
        >
          {error}
        </p>
      ) : null}
    </div>
  );
}

export function uploadHint(kind: DocumentKind) {
  if (kind === "hmoCardBack") {
    return "Required only if your provider prints details on the back.";
  }
  return `JPG, PNG, or WEBP · under ${MAX_DOCUMENT_BYTES / (1024 * 1024)} MB`;
}

export { HMO_PROVIDERS, NAME_SUFFIXES };
export type { AppointmentField };
