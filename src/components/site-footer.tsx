import Link from "next/link";
import { LOCATIONS } from "@/lib/booking/schema";
import { services } from "@/lib/services/catalog";

const EMERGENCY_TEL = "+63288888888";
const EMERGENCY_DISPLAY = "(02) 8888-8888";
const CLINIC_EMAIL = "hello@urbansmiles.ph";

const exploreLinks = [
  { label: "Home", href: "/" },
  { label: "Services", href: "/#services" },
  { label: "Dentists", href: "/dentists" },
  { label: "About", href: "/#philosophy" },
  { label: "Book an appointment", href: "/book" },
] as const;

const clinicHours = [
  { days: "Monday – Saturday", hours: "9:00 AM – 6:00 PM" },
  { days: "Sunday", hours: "Closed" },
  { days: "Dental emergency", hours: "24-hour hotline" },
] as const;

const linkClass =
  "inline-flex min-h-11 items-center text-sm text-muted transition-colors hover:text-teal focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal";

export function SiteFooter() {
  return (
    <footer className="mt-auto border-t border-ink/10 bg-sand/40">
      <div className="mx-auto max-w-7xl px-4 pt-14 pb-[max(2.5rem,env(safe-area-inset-bottom))] sm:px-6 sm:pt-16 lg:pt-20">
        <div className="grid gap-12 sm:grid-cols-2 lg:grid-cols-[1.15fr_0.85fr_0.85fr_1fr] lg:gap-10">
          <div>
            <Link
              href="/"
              className="inline-flex min-h-11 items-center font-display text-lg font-semibold tracking-[0.2em] text-ink uppercase focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal"
            >
              Urban Smiles
            </Link>
            <p className="mt-4 max-w-sm leading-relaxed text-muted">
              Comprehensive, gentle dental care across Metro Manila. Written
              treatment plans, HMO cards accepted, and visits confirmed
              automatically after verification.
            </p>
            <a
              href={`tel:${EMERGENCY_TEL}`}
              className="mt-6 inline-flex min-h-11 items-center gap-3 rounded-full border border-ink/20 px-5 text-sm font-semibold text-ink transition-colors hover:border-teal hover:text-teal focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal"
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
                className="size-5 text-teal"
              >
                <path d="M6.5 3.5h3l1.5 4-2 1.5a12 12 0 0 0 6 6l1.5-2 4 1.5v3c0 1.2-1 2.2-2.2 2-7.2-1.1-13-6.9-14.1-14.1-.2-1.2.8-2.2 2-2.2Z" />
              </svg>
              Emergency ·{" "}
              <span className="tabular-nums">{EMERGENCY_DISPLAY}</span>
            </a>
          </div>

          <nav aria-label="Explore">
            <p className="text-xs font-semibold tracking-[0.18em] text-ink uppercase">
              Explore
            </p>
            <ul className="mt-4">
              {exploreLinks.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className={linkClass}>
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <nav aria-label="Treatments">
            <p className="text-xs font-semibold tracking-[0.18em] text-ink uppercase">
              Treatments
            </p>
            <ul className="mt-4">
              {services.map((service) => (
                <li key={service.slug}>
                  <Link
                    href={`/services/${service.slug}`}
                    className={linkClass}
                  >
                    {service.name}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <div>
            <p className="text-xs font-semibold tracking-[0.18em] text-ink uppercase">
              Visit
            </p>
            <dl className="mt-5 space-y-3">
              {clinicHours.map((slot) => (
                <div
                  key={slot.days}
                  className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 border-b border-ink/10 pb-3 last:border-0 last:pb-0"
                >
                  <dt className="text-sm text-muted">{slot.days}</dt>
                  <dd className="text-sm font-semibold text-ink tabular-nums">
                    {slot.hours}
                  </dd>
                </div>
              ))}
            </dl>

            <ul className="mt-6 space-y-1">
              {LOCATIONS.map((location) => (
                <li key={location.id}>
                  <Link
                    href={`/book?location=${location.id}`}
                    className={linkClass}
                  >
                    {location.name}
                  </Link>
                </li>
              ))}
            </ul>

            <a
              href={`mailto:${CLINIC_EMAIL}`}
              className={`${linkClass} mt-2`}
            >
              {CLINIC_EMAIL}
            </a>
          </div>
        </div>

        <div className="mt-12 flex flex-col gap-4 border-t border-ink/10 pt-6 sm:mt-16 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-muted">
            © 2026 Urban Smiles Dental Clinic. All rights reserved.
          </p>
          <Link
            href="/book"
            className="inline-flex min-h-11 w-full items-center justify-center rounded-full border border-ink/20 px-6 text-sm font-semibold text-ink transition-colors hover:border-teal hover:text-teal focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal sm:w-auto"
          >
            Request a visit
          </Link>
        </div>
      </div>
    </footer>
  );
}
