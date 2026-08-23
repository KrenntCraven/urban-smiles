import type { Metadata } from "next";
import Link from "next/link";
import { DentistDirectory } from "@/components/team/dentist-directory";
import { LOCATIONS } from "@/lib/booking/schema";
import { dentists, getDentistSpecialties } from "@/lib/team/roster";

export const metadata: Metadata = {
  title: "Meet Our Dentists — Urban Smiles",
  description:
    "The specialists behind Urban Smiles: their training, certifications, office hours, and how to book directly with each of them.",
  alternates: { canonical: "/dentists" },
};

export default function DentistsPage() {
  const specialties = getDentistSpecialties();

  const stats = [
    { label: "Specialists on staff", value: String(dentists.length) },
    { label: "Metro Manila branches", value: String(LOCATIONS.length) },
    { label: "Typical wait for a slot", value: "Same week" },
  ];

  return (
    <>
      <header className="border-b border-ink/10 bg-sand/40">
        <div className="mx-auto max-w-7xl px-4 pt-8 pb-12 sm:px-6 sm:pt-10 sm:pb-14 lg:pt-12 lg:pb-16">
          <nav aria-label="Breadcrumb">
            <ol className="flex flex-wrap items-center gap-2 text-sm text-muted">
              <li>
                <Link
                  href="/"
                  className="transition-colors hover:text-teal focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal"
                >
                  Home
                </Link>
              </li>
              <li aria-hidden="true">/</li>
              <li aria-current="page" className="text-ink">
                Our Dentists
              </li>
            </ol>
          </nav>

          <p className="mt-8 flex items-center gap-3 text-xs font-semibold tracking-[0.28em] text-teal uppercase">
            <span aria-hidden="true" className="h-px w-8 bg-teal/40" />
            Our Clinical Team
          </p>

          <h1 className="mt-5 max-w-3xl font-display text-4xl leading-[1.05] font-semibold tracking-tight text-ink sm:text-5xl lg:text-6xl">
            Meet the experts behind your smile.
          </h1>

          <p className="mt-6 max-w-2xl text-lg leading-relaxed text-ink/80 sm:text-xl">
            Every Urban Smiles dentist is a specialist in their field, and every
            one of them explains the plan before starting it. Read their
            training, hours, and approach — then book with the one you want.
          </p>

          <dl className="mt-10 grid gap-6 border-t border-ink/10 pt-6 sm:grid-cols-3 sm:gap-4">
            {stats.map((stat) => (
              <div key={stat.label}>
                <dt className="text-xs font-semibold tracking-[0.18em] text-muted uppercase">
                  {stat.label}
                </dt>
                <dd className="mt-1.5 font-display text-2xl font-semibold text-ink tabular-nums">
                  {stat.value}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </header>

      <section aria-labelledby="directory-heading">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16 lg:py-20">
          <h2
            id="directory-heading"
            className="mb-6 font-display text-2xl font-semibold tracking-[0.01em] text-ink uppercase sm:mb-8 sm:text-3xl"
          >
            Browse by specialty
          </h2>

          <DentistDirectory dentists={dentists} specialties={specialties} />
        </div>
      </section>
    </>
  );
}
