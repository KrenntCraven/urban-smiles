import { BookServiceButton } from "@/components/booking/book-service-button";
import {
  formatDuration,
  formatPeso,
  formatVisits,
} from "@/lib/services/format";
import type { Service, ServiceOption } from "@/lib/services/types";

export function ServiceBookingCard({
  service,
  services,
}: {
  service: Service;
  services: ServiceOption[];
}) {
  const { pricing, duration } = service;

  const facts = [
    { label: "Chair time", value: formatDuration(duration) },
    { label: "Appointments", value: formatVisits(duration.visits) },
    {
      label: "Price range",
      value:
        pricing.to === undefined
          ? formatPeso(pricing.from)
          : `${formatPeso(pricing.from)} – ${formatPeso(pricing.to)}`,
    },
  ];

  return (
    <aside className="lg:sticky lg:top-[calc(var(--header-height)+1.5rem)] lg:col-start-2 lg:row-start-1">
      <div className="rounded-2xl bg-cream p-6 shadow-lg shadow-ink/5 ring-1 ring-ink/10 sm:p-7">
        <p className="text-xs font-semibold tracking-[0.28em] text-teal uppercase">
          Starting at
        </p>
        <p className="mt-2 font-display text-3xl font-semibold text-ink tabular-nums sm:text-4xl">
          {formatPeso(pricing.from)}
          {pricing.unit ? (
            <span className="ml-2 align-middle font-sans text-sm font-medium text-muted">
              {pricing.unit}
            </span>
          ) : null}
        </p>
        {pricing.note ? (
          <p className="mt-2 text-sm leading-relaxed text-muted">
            {pricing.note}
          </p>
        ) : null}

        <dl className="mt-6 space-y-3 border-t border-ink/10 pt-6">
          {facts.map((fact) => (
            <div
              key={fact.label}
              className="grid grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)] gap-4"
            >
              <dt className="text-sm text-muted">{fact.label}</dt>
              <dd className="min-w-0 text-right text-sm font-semibold text-ink tabular-nums">
                {fact.value}
              </dd>
            </div>
          ))}
        </dl>

        <div className="mt-7">
          <BookServiceButton
            serviceSlug={service.slug}
            serviceName={service.name}
            services={services}
          />
          <p className="mt-3 text-center text-xs text-muted">
            Takes under a minute · No payment today
          </p>
        </div>

        <div className="mt-6 border-t border-ink/10 pt-5 text-sm">
          <p className="font-semibold text-ink">Prefer to talk it through?</p>
          <a
            href="tel:+63288888888"
            className="mt-1 inline-block font-semibold text-teal tabular-nums underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal"
          >
            (02) 8888-8888
          </a>
        </div>
      </div>
    </aside>
  );
}
