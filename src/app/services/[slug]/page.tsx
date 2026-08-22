import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { FaqList } from "@/components/services/faq-list";
import { ServiceBookingCard } from "@/components/services/service-booking-card";
import {
  getAllServiceSlugs,
  getRelatedServices,
  getServiceBySlug,
  getServiceOptions,
} from "@/lib/services/catalog";
import { formatDuration, formatMinutes, formatVisits } from "@/lib/services/format";
import { serviceCategoryLabels } from "@/lib/services/types";

export const dynamicParams = false;

export function generateStaticParams() {
  return getAllServiceSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata(
  props: PageProps<"/services/[slug]">,
): Promise<Metadata> {
  const { slug } = await props.params;
  const service = getServiceBySlug(slug);

  if (!service) return {};

  return {
    title: `${service.name} — Urban Smiles`,
    description: service.tagline,
    alternates: { canonical: `/services/${service.slug}` },
  };
}

export default async function ServiceDetailPage(
  props: PageProps<"/services/[slug]">,
) {
  const { slug } = await props.params;
  const service = getServiceBySlug(slug);

  if (!service) notFound();

  const services = getServiceOptions();
  const related = getRelatedServices(service);

  const quickFacts = [
    { label: "Chair time", value: formatDuration(service.duration) },
    { label: "Appointments", value: formatVisits(service.duration.visits) },
    { label: "Category", value: serviceCategoryLabels[service.category] },
  ];

  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: service.faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: { "@type": "Answer", text: faq.answer },
    })),
  };

  return (
    <article>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />

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
              <li>
                <Link
                  href="/#services"
                  className="transition-colors hover:text-teal focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal"
                >
                  Services
                </Link>
              </li>
              <li aria-hidden="true">/</li>
              <li aria-current="page" className="text-ink">
                {service.name}
              </li>
            </ol>
          </nav>

          <p className="mt-8 flex items-center gap-3 text-xs font-semibold tracking-[0.28em] text-teal uppercase">
            <span aria-hidden="true" className="h-px w-8 bg-teal/40" />
            {serviceCategoryLabels[service.category]}
          </p>

          <h1 className="mt-5 max-w-3xl font-display text-4xl leading-[1.05] font-semibold tracking-tight text-ink sm:text-5xl">
            {service.name}
          </h1>

          <p className="mt-5 max-w-2xl text-lg leading-relaxed text-ink/80">
            {service.tagline}
          </p>

          <dl className="mt-8 flex flex-wrap gap-x-10 gap-y-4">
            {quickFacts.map((fact) => (
              <div key={fact.label}>
                <dt className="text-xs font-semibold tracking-[0.18em] text-muted uppercase">
                  {fact.label}
                </dt>
                <dd className="mt-1 font-semibold text-ink tabular-nums">
                  {fact.value}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16 lg:py-20">
        <div className="grid gap-14 lg:grid-cols-[minmax(0,1fr)_21rem] lg:items-start lg:gap-16">
          <ServiceBookingCard service={service} services={services} />

          <div className="space-y-14 lg:col-start-1 lg:row-start-1 lg:space-y-16">
            <section id="overview" className="snap-none md:snap-start">
              <h2 className="font-display text-2xl font-semibold tracking-[0.01em] text-ink uppercase sm:text-3xl">
                Treatment overview
              </h2>
              <div className="mt-6 space-y-4">
                {service.detailedOverview.map((paragraph) => (
                  <p
                    key={paragraph.slice(0, 40)}
                    className="max-w-xl leading-relaxed text-muted"
                  >
                    {paragraph}
                  </p>
                ))}
              </div>

              <div className="mt-10 grid gap-6 sm:grid-cols-2">
                <div className="rounded-2xl bg-cream p-6 ring-1 ring-ink/10">
                  <h3 className="font-display text-lg font-semibold tracking-[0.01em] text-ink uppercase">
                    What&rsquo;s included
                  </h3>
                  <ul className="mt-4 space-y-2.5">
                    {service.highlights.map((highlight) => (
                      <li
                        key={highlight}
                        className="flex gap-3 text-sm text-muted"
                      >
                        <CheckIcon />
                        {highlight}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="rounded-2xl bg-mint/40 p-6 ring-1 ring-teal/15">
                  <h3 className="font-display text-lg font-semibold tracking-[0.01em] text-ink uppercase">
                    Recommended for
                  </h3>
                  <ul className="mt-4 space-y-2.5">
                    {service.recommendedFor.map((item) => (
                      <li key={item} className="flex gap-3 text-sm text-muted">
                        <CheckIcon />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </section>

            <section id="procedure" className="snap-none md:snap-start">
              <h2 className="font-display text-2xl font-semibold tracking-[0.01em] text-ink uppercase sm:text-3xl">
                What happens, step by step
              </h2>
              <ol className="mt-8 space-y-4">
                {service.procedureSteps.map((step, index) => (
                  <li
                    key={step.title}
                    className="rounded-2xl bg-cream p-6 ring-1 ring-ink/10 sm:flex sm:gap-6"
                  >
                    <span
                      aria-hidden="true"
                      className="flex size-10 shrink-0 items-center justify-center rounded-full bg-mint font-display text-lg font-semibold text-teal tabular-nums"
                    >
                      {index + 1}
                    </span>
                    <div className="mt-4 sm:mt-0">
                      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                        <h3 className="font-semibold text-ink">{step.title}</h3>
                        {step.durationMinutes ? (
                          <span className="text-xs font-medium text-muted tabular-nums">
                            {formatMinutes(step.durationMinutes)}
                          </span>
                        ) : null}
                      </div>
                      <p className="mt-2 leading-relaxed text-muted">
                        {step.description}
                      </p>
                    </div>
                  </li>
                ))}
              </ol>
            </section>

            <section id="faqs" className="snap-none md:snap-start">
              <h2 className="font-display text-2xl font-semibold tracking-[0.01em] text-ink uppercase sm:text-3xl">
                Questions patients ask
              </h2>
              <FaqList faqs={service.faqs} />
            </section>

            {related.length > 0 ? (
              <section id="related" className="snap-none md:snap-start">
                <h2 className="font-display text-2xl font-semibold tracking-[0.01em] text-ink uppercase sm:text-3xl">
                  Often booked together
                </h2>
                <ul className="mt-8 grid gap-4 sm:grid-cols-2">
                  {related.map((item) => (
                    <li key={item.slug}>
                      <Link
                        href={`/services/${item.slug}`}
                        className="group block h-full rounded-2xl bg-cream p-6 ring-1 ring-ink/10 transition-shadow hover:shadow-lg hover:shadow-ink/5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal"
                      >
                        <p className="text-xs font-semibold tracking-[0.18em] text-teal uppercase">
                          {serviceCategoryLabels[item.category]}
                        </p>
                        <h3 className="mt-2 font-display text-lg font-semibold text-ink">
                          {item.name}
                        </h3>
                        <p className="mt-2 text-sm leading-relaxed text-muted">
                          {item.tagline}
                        </p>
                        <span className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-teal">
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
              </section>
            ) : null}
          </div>

        </div>
      </div>
    </article>
  );
}

function CheckIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className="mt-0.5 size-4 shrink-0 text-teal"
    >
      <path d="m5 12.5 4.5 4.5L19 7.5" />
    </svg>
  );
}
