import Image from "next/image";
import type { ReactNode } from "react";

type CoreValue = {
  title: string;
  description: string;
  icon: ReactNode;
};

const iconClass = "size-6";

const coreValues: CoreValue[] = [
  {
    title: "Expertise",
    description:
      "Board-certified specialists using advanced dental technology.",
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
        className={iconClass}
      >
        <circle cx="12" cy="9" r="5.5" />
        <path d="M8.5 13.6 7 21.5l5-2.6 5 2.6-1.5-7.9" />
      </svg>
    ),
  },
  {
    title: "Care",
    description: "Gentle, pain-managed procedures in a welcoming space.",
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
        className={iconClass}
      >
        <path d="M12 20.3s-7.5-4.4-7.5-9.6A4.2 4.2 0 0 1 12 8.2a4.2 4.2 0 0 1 7.5 2.5c0 5.2-7.5 9.6-7.5 9.6Z" />
      </svg>
    ),
  },
  {
    title: "Confidence",
    description: "Transparent treatment plans with zero unexpected costs.",
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
        className={iconClass}
      >
        <path d="M12 3 4.5 6v6c0 4.4 3.2 7.9 7.5 9 4.3-1.1 7.5-4.6 7.5-9V6L12 3Z" />
        <path d="m9 12 2.2 2.2L15.4 10" />
      </svg>
    ),
  },
];

export function Philosophy() {
  return (
    <section
      id="philosophy"
      className="border-y border-ink/10 bg-sand/40"
    >
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20 lg:py-28">
        <div className="grid items-center gap-x-16 gap-y-14 sm:gap-y-20 lg:grid-cols-2">
          <figure className="relative">
            <div className="relative aspect-16/9 overflow-hidden rounded-[2rem] ring-1 ring-ink/10">
              <div
                data-parallax
                data-parallax-distance="20"
                className="absolute -inset-4"
              >
                <Image
                  src="/team/dr-amelia-santos.png"
                  alt="Dr. Amelia Santos, DMD, in the Urban Smiles reception area."
                  fill
                  sizes="(min-width: 1024px) 600px, 100vw"
                  className="object-cover"
                />
              </div>
            </div>
            <figcaption
              data-parallax
              data-parallax-distance="38"
              className="relative mt-4 rounded-2xl bg-cream px-5 py-4 shadow-xl ring-1 ring-ink/10 sm:absolute sm:-bottom-6 sm:left-6 sm:mt-0"
            >
              <p className="font-display text-lg font-semibold text-ink">
                Dr. Amelia Santos, DMD
              </p>
              <p className="text-sm text-muted">Lead Dentist, Urban Smiles</p>
            </figcaption>
          </figure>

          <div>
            <p className="flex items-center gap-3 text-xs font-semibold tracking-[0.28em] text-teal uppercase">
              <span aria-hidden="true" className="h-px w-8 bg-teal/40" />
              Our Philosophy
            </p>
            <h2 className="mt-5 font-display text-3xl leading-[1.1] font-semibold tracking-[0.01em] text-ink uppercase sm:text-4xl lg:text-5xl">
              Dentistry, with you in mind.
            </h2>
            <p className="mt-6 font-display text-2xl leading-snug text-ink sm:text-3xl">
              Your dental care should feel personal, never rushed.
            </p>
            <p className="mt-4 max-w-xl leading-relaxed text-muted">
              At Urban Smiles, we pair genuinely modern equipment with the time
              to use it well: digital scans instead of impression trays,
              same-day crowns, and a written treatment plan you review before we
              begin.
            </p>
          </div>
        </div>

        <ul className="mt-14 grid gap-6 sm:mt-20 md:grid-cols-3">
          {coreValues.map((value) => (
            <li
              key={value.title}
              className="rounded-2xl bg-cream p-6 ring-1 ring-ink/10 transition-shadow hover:shadow-lg hover:shadow-ink/5 sm:p-8"
            >
              <span className="flex size-12 items-center justify-center rounded-full bg-mint text-teal">
                {value.icon}
              </span>
              <h3 className="mt-6 font-display text-xl font-semibold tracking-[0.01em] text-ink uppercase">
                {value.title}
              </h3>
              <p className="mt-3 leading-relaxed text-muted">
                {value.description}
              </p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
