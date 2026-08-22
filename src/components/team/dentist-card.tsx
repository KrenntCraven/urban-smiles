import Image from "next/image";
import Link from "next/link";
import { buildQuickBookingHref } from "@/lib/booking/schema";
import { dentistSpecialtyLabels, type Dentist } from "@/lib/team/types";

export function DentistCard({
  dentist,
  priority,
  onViewProfile,
}: {
  dentist: Dentist;
  priority: boolean;
  onViewProfile: () => void;
}) {
  return (
    <article className="flex h-full flex-col overflow-hidden rounded-2xl bg-cream ring-1 ring-ink/10 transition-shadow hover:shadow-lg hover:shadow-ink/5">
      <div className="relative aspect-16/9 bg-sand">
        <Image
          src={dentist.photo}
          alt={dentist.photoAlt}
          fill
          priority={priority}
          sizes="(min-width: 1280px) 400px, (min-width: 1024px) 31vw, (min-width: 640px) 46vw, 100vw"
          className="object-cover"
        />
      </div>

      <div className="flex flex-1 flex-col p-6 sm:p-7">
        <p className="text-xs font-semibold tracking-[0.18em] text-teal uppercase">
          {dentist.specialties
            .map((specialty) => dentistSpecialtyLabels[specialty])
            .join(" · ")}
        </p>

        <h3 className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-2 font-display text-2xl font-semibold tracking-tight text-ink">
          {dentist.name}
          <span className="rounded-full bg-mint px-2.5 py-1 text-xs font-semibold tracking-[0.12em] text-teal uppercase">
            {dentist.credential}
          </span>
        </h3>

        <p className="mt-2 text-sm text-muted">{dentist.role}</p>

        <p className="mt-4 leading-relaxed text-muted">{dentist.philosophy}</p>

        <ul className="mt-5 flex flex-wrap gap-2">
          {dentist.focusAreas.map((area) => (
            <li
              key={area}
              className="rounded-full bg-sand px-3 py-1 text-xs font-medium text-ink/80"
            >
              {area}
            </li>
          ))}
        </ul>

        <div className="mt-auto flex flex-wrap items-center gap-x-5 gap-y-3 border-t border-ink/10 pt-5">
          <button
            type="button"
            onClick={onViewProfile}
            aria-haspopup="dialog"
            className="inline-flex min-h-11 items-center justify-center rounded-full border border-ink/20 px-5 text-sm font-semibold text-ink transition-colors hover:border-teal hover:text-teal focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal"
          >
            View Profile
            <span className="sr-only"> for {dentist.name}</span>
          </button>

          <Link
            href={buildQuickBookingHref({
              service: dentist.defaultServiceSlug,
              dentist: dentist.slug,
              location: dentist.branchId,
            })}
            className="group inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-teal transition-colors hover:text-teal-dark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal"
          >
            Book Appointment
            <span className="sr-only">with {dentist.name}</span>
            <span
              aria-hidden="true"
              className="transition-transform group-hover:translate-x-1"
            >
              →
            </span>
          </Link>
        </div>
      </div>
    </article>
  );
}
