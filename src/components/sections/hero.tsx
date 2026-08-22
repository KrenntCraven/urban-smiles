import Link from "next/link";
import { LOCATIONS } from "@/lib/booking/schema";

const trustPoints = [
  {
    headline: `${LOCATIONS.length} Branches`,
    detail: LOCATIONS.map((location) => location.name.split(" — ")[0]).join(
      ", ",
    ),
  },
  {
    headline: "0% Installment Plans",
    detail: "HMO accepted",
  },
];

export function Stars({ className = "" }: { className?: string }) {
  return (
    <span
      className={`flex items-center gap-0.5 text-gold ${className}`}
      role="img"
      aria-label="Rated 4.9 out of 5 stars"
    >
      {Array.from({ length: 5 }).map((_, index) => (
        <svg
          key={index}
          viewBox="0 0 20 20"
          fill="currentColor"
          aria-hidden="true"
          className="size-4"
        >
          <path d="M10 1.5l2.47 5.2 5.53.78-4 4.06.95 5.71L10 14.55l-4.95 2.7.95-5.71-4-4.06 5.53-.78L10 1.5z" />
        </svg>
      ))}
    </span>
  );
}

export function Hero() {
  return (
    <section className="relative min-h-[calc(100dvh-var(--header-height))] overflow-hidden">
      <div
        aria-hidden="true"
        data-parallax
        data-parallax-distance="48"
        className="pointer-events-none absolute -top-40 -right-32 size-[34rem] rounded-full bg-mint/50 blur-3xl"
      />
      <div
        aria-hidden="true"
        data-parallax
        data-parallax-distance="-34"
        className="pointer-events-none absolute -bottom-48 -left-40 size-[30rem] rounded-full bg-sand blur-3xl"
      />

      <div className="relative mx-auto grid max-w-7xl items-center gap-10 px-4 pt-10 pb-16 sm:px-6 sm:pt-12 sm:pb-20 lg:grid-cols-[1.05fr_0.95fr] lg:gap-16 lg:pt-16 lg:pb-28">
        <div>
          <p className="flex items-center gap-3 text-xs font-semibold tracking-[0.28em] text-teal uppercase">
            <span aria-hidden="true" className="h-px w-8 bg-teal/40" />
            Modern Dental Care
          </p>

          <h1 className="mt-5 font-display text-4xl leading-[1.05] font-semibold tracking-tight text-ink sm:text-5xl lg:text-6xl">
            Your smile, in expert hands.
          </h1>

          <p className="mt-6 max-w-xl text-lg leading-relaxed text-ink/80 sm:text-xl">
            Comprehensive, gentle dental care designed around your comfort,
            health, and confidence.
          </p>

          <p className="mt-3 hidden max-w-xl leading-relaxed text-muted sm:block">
            From routine checkups to full smile transformations — personalized
            care in a relaxed, state-of-the-art environment.
          </p>

          <p className="mt-8 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-sm text-muted">
            <Stars />
            <span className="font-semibold text-ink tabular-nums">4.9/5</span>
            <span>from 500+ Google reviews</span>
          </p>

          <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
            <Link
              href="/#book"
              className="inline-flex items-center justify-center rounded-full bg-teal px-7 py-3.5 text-base font-semibold text-cream shadow-lg shadow-teal/20 transition-colors hover:bg-teal-dark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal"
            >
              Book an Appointment
            </Link>
            <Link
              href="/#services"
              className="group inline-flex items-center justify-center gap-2 rounded-full border border-ink/20 px-7 py-3.5 text-base font-semibold text-ink transition-colors hover:border-teal hover:text-teal focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal"
            >
              Explore Our Services
              <span
                aria-hidden="true"
                className="transition-transform group-hover:translate-x-1"
              >
                →
              </span>
            </Link>
          </div>

          <p className="mt-3 text-sm text-muted">
            Takes under a minute · Same-day slots available
          </p>

          <dl className="mt-10 grid gap-6 border-t border-ink/10 pt-6 sm:grid-cols-3 sm:gap-4">
            {trustPoints.map((point) => (
              <div key={point.headline}>
                <dt className="text-sm font-semibold text-ink tabular-nums">
                  {point.headline}
                </dt>
                <dd className="text-sm text-muted">{point.detail}</dd>
              </div>
            ))}

            <div>
              <dt className="text-sm font-semibold text-ink">
                Dental emergency?
              </dt>
              <dd className="text-sm">
                <a
                  href="tel:+63288888888"
                  className="font-semibold text-teal tabular-nums underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal"
                >
                  (02) 8888-8888
                </a>
              </dd>
            </div>
          </dl>
        </div>

        <div className="relative">
          <div
            data-parallax
            data-parallax-distance="22"
            className="relative aspect-4/3 overflow-hidden rounded-[2rem] bg-gradient-to-br from-mint via-cream to-sand ring-1 ring-ink/10 sm:aspect-square lg:aspect-4/5"
          >
            <div
              aria-hidden="true"
              data-parallax
              data-parallax-distance="-16"
              className="absolute inset-0 opacity-40"
              style={{
                backgroundImage:
                  "radial-gradient(circle, rgba(15,42,38,0.18) 1px, transparent 1px)",
                backgroundSize: "22px 22px",
              }}
            />
            <svg
              aria-hidden="true"
              viewBox="0 0 64 64"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinejoin="round"
              className="absolute top-1/2 left-1/2 size-56 -translate-x-1/2 -translate-y-1/2 text-teal/25"
            >
              <path d="M32 9c-6 0-8-3-14-3-7 0-12 5-12 14 0 10 4 14 6 22 2 7 3 14 8 14 4 0 4-8 6-14 1-4 3-6 6-6s5 2 6 6c2 6 2 14 6 14 5 0 6-7 8-14 2-8 6-12 6-22 0-9-5-14-12-14-6 0-8 3-14 3Z" />
            </svg>
          </div>

          <div
            data-parallax
            data-parallax-distance="44"
            className="absolute -top-5 -left-5 hidden rounded-2xl bg-cream px-5 py-4 shadow-xl ring-1 ring-ink/10 sm:block"
          >
            <p className="text-xs font-semibold tracking-[0.18em] text-muted uppercase">
              Next Available
            </p>
            <p className="mt-1 font-display text-lg font-semibold text-ink tabular-nums">
              Today, 2:30 PM
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
