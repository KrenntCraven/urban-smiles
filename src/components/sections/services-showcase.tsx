import Link from "next/link";
import { services } from "@/lib/services/catalog";
import { formatDuration, formatPeso } from "@/lib/services/format";
import { serviceCategoryLabels } from "@/lib/services/types";

export function ServicesShowcase() {
  return (
    <section id="services">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20 lg:py-28">
        <div className="max-w-2xl">
          <p className="flex items-center gap-3 text-xs font-semibold tracking-[0.28em] text-teal uppercase">
            <span aria-hidden="true" className="h-px w-8 bg-teal/40" />
            Our Treatments
          </p>
          <h2 className="mt-5 font-display text-3xl leading-[1.1] font-semibold tracking-[0.01em] text-ink uppercase sm:text-4xl lg:text-5xl">
            Find the treatment you need.
          </h2>
          <p className="mt-6 leading-relaxed text-muted">
            Every treatment page sets out exactly what happens, how long it
            takes, and what it costs — before you book.
          </p>
        </div>

        <ul className="mt-10 grid gap-6 sm:mt-14 md:grid-cols-2">
          {services.map((service) => (
            <li key={service.slug}>
              <Link
                href={`/services/${service.slug}`}
                className="group flex h-full flex-col rounded-2xl bg-cream p-6 ring-1 ring-ink/10 transition-shadow hover:shadow-lg hover:shadow-ink/5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal sm:p-8"
              >
                <p className="text-xs font-semibold tracking-[0.18em] text-teal uppercase">
                  {serviceCategoryLabels[service.category]}
                </p>

                <h3 className="mt-3 font-display text-2xl font-semibold tracking-tight text-ink">
                  {service.name}
                </h3>

                <p className="mt-3 leading-relaxed text-muted">
                  {service.tagline}
                </p>

                <dl className="mt-6 flex flex-wrap gap-x-8 gap-y-3 border-t border-ink/10 pt-5">
                  <div>
                    <dt className="text-xs font-semibold tracking-[0.18em] text-muted uppercase">
                      From
                    </dt>
                    <dd className="mt-1 font-semibold text-ink tabular-nums">
                      {formatPeso(service.pricing.from)}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs font-semibold tracking-[0.18em] text-muted uppercase">
                      Chair time
                    </dt>
                    <dd className="mt-1 font-semibold text-ink tabular-nums">
                      {formatDuration(service.duration)}
                    </dd>
                  </div>
                </dl>

                <span className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-teal">
                  View treatment
                  <span
                    aria-hidden="true"
                    className="transition-transform group-hover:translate-x-1"
                  >
                    →
                  </span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
