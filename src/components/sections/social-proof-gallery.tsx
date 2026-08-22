"use client";

import Image from "next/image";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type KeyboardEvent,
  type PointerEvent,
} from "react";

type PatientReview = {
  quote: string;
  patient: string;
  treatment: string;
  branch: string;
  rating: number;
};

/**
 * Treatments and branches are worded to match the service catalog and
 * `LOCATIONS`, and the ratings average the 4.9 the hero advertises.
 */
const reviews: readonly PatientReview[] = [
  {
    quote:
      "Dr. Amelia showed me the whitening shade before we started and checked in throughout. The result looks natural, and the sensitivity was gone by the next morning.",
    patient: "Mara D.",
    treatment: "Professional Teeth Whitening",
    branch: "BGC",
    rating: 5,
  },
  {
    quote:
      "Every aligner change was explained in plain language. I always knew what was moving, why it mattered, and what the next appointment would cover.",
    patient: "Paolo R.",
    treatment: "Invisalign Clear Aligners",
    branch: "Makati",
    rating: 5,
  },
  {
    quote:
      "My daughter usually freezes at the dentist, but Dr. Celine let her inspect every tool first. She left asking when she could come back.",
    patient: "Ana L.",
    treatment: "Routine Cleaning & Checkup",
    branch: "Quezon City",
    rating: 5,
  },
  {
    quote:
      "I put off the implant for two years because I expected a fight over the price. They walked me through the full cost in one sitting and it never moved.",
    patient: "Ramon T.",
    treatment: "Dental Implants",
    branch: "BGC",
    rating: 5,
  },
  {
    quote:
      "My gums had been bleeding for months and I assumed the cleaning would hurt. They numbed the area first and I felt almost nothing the whole session.",
    patient: "Jessa M.",
    treatment: "Routine Cleaning & Checkup",
    branch: "Ortigas",
    rating: 5,
  },
  {
    quote:
      "The treatment itself was excellent and my bite now sits exactly where Dr. Cruz projected it would. My only note is that the first appointment started about twenty minutes behind schedule.",
    patient: "Karl V.",
    treatment: "Invisalign Clear Aligners",
    branch: "Makati",
    rating: 4,
  },
  {
    quote:
      "I wanted my teeth brighter for a wedding but not obviously fake. They talked me down two shades from what I asked for, and they were right.",
    patient: "Divina S.",
    treatment: "Professional Teeth Whitening",
    branch: "Ortigas",
    rating: 5,
  },
  {
    quote:
      "The digital scan replaced the impression tray I had been dreading, and the temporary crown fit properly on the first try. Recovery was far easier than I was warned to expect.",
    patient: "Nico A.",
    treatment: "Dental Implants",
    branch: "Makati",
    rating: 5,
  },
  {
    quote:
      "They found a hairline crack early and showed me the scan on screen rather than just telling me about it. Fixing it then cost a fraction of what a root canal would have.",
    patient: "Trina B.",
    treatment: "Routine Cleaning & Checkup",
    branch: "BGC",
    rating: 5,
  },
  {
    quote:
      "I came in on an HMO card expecting to be treated as an afterthought. The coverage was sorted before my appointment and nobody rushed the consultation.",
    patient: "Elmer P.",
    treatment: "Dental Implants",
    branch: "Quezon City",
    rating: 5,
  },
];

function Stars({ rating }: { rating: number }) {
  return (
    <span
      className="flex items-center gap-0.5"
      role="img"
      aria-label={`${rating} out of 5 stars`}
    >
      {Array.from({ length: 5 }).map((_, index) => (
        <svg
          key={index}
          viewBox="0 0 20 20"
          fill="currentColor"
          aria-hidden="true"
          className={`size-4 ${index < rating ? "text-gold" : "text-ink/15"}`}
        >
          <path d="M10 1.5l2.47 5.2 5.53.78-4 4.06.95 5.71L10 14.55l-4.95 2.7.95-5.71-4-4.06 5.53-.78L10 1.5z" />
        </svg>
      ))}
    </span>
  );
}

function ReviewCarousel() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const reduceMotion = useReducedMotion();

  const move = useCallback((direction: 1 | -1) => {
    setActiveIndex(
      (current) => (current + direction + reviews.length) % reviews.length,
    );
  }, []);

  useEffect(() => {
    if (isPaused || reduceMotion) return;
    const timer = window.setInterval(() => move(1), 6500);
    return () => window.clearInterval(timer);
  }, [isPaused, move, reduceMotion]);

  const review = reviews[activeIndex];

  return (
    <div
      className="flex h-full flex-col"
      onPointerEnter={() => setIsPaused(true)}
      onPointerLeave={() => setIsPaused(false)}
      onFocusCapture={() => setIsPaused(true)}
      onBlurCapture={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) {
          setIsPaused(false);
        }
      }}
    >
      <div className="relative min-h-96 flex-1 overflow-hidden rounded-[2rem] bg-cream p-7 ring-1 ring-ink/10 sm:p-9">
        <svg
          viewBox="0 0 24 24"
          fill="currentColor"
          aria-hidden="true"
          className="size-9 text-mint"
        >
          <path d="M5.7 6.5H11v5.2c0 3.9-1.8 6.1-5.6 6.8l-.8-2.2c2.1-.6 3-1.6 3.1-3H5.7V6.5Zm8.3 0h5.3v5.2c0 3.9-1.8 6.1-5.6 6.8l-.8-2.2c2.1-.6 3-1.6 3.1-3H14V6.5Z" />
        </svg>

        <div aria-live="off">
          <AnimatePresence mode="wait" initial={false}>
            <motion.figure
              key={activeIndex}
              initial={reduceMotion ? false : { opacity: 0, x: 18 }}
              animate={{ opacity: 1, x: 0 }}
              exit={reduceMotion ? undefined : { opacity: 0, x: -18 }}
              transition={{ duration: reduceMotion ? 0 : 0.28 }}
              className="mt-5"
            >
              <Stars rating={review.rating} />
              <blockquote className="mt-5 font-display text-2xl leading-snug text-ink sm:text-3xl">
                “{review.quote}”
              </blockquote>
              <figcaption className="mt-7 flex flex-wrap items-center gap-3">
                <span className="font-semibold text-ink">{review.patient}</span>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-mint px-3 py-1 text-xs font-semibold text-teal">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.6"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                    className="size-4"
                  >
                    <path d="M12 3 4.5 6v6c0 4.4 3.2 7.9 7.5 9 4.3-1.1 7.5-4.6 7.5-9V6L12 3Z" />
                    <path d="m9 12 2.2 2.2L15.4 10" />
                  </svg>
                  Verified patient
                </span>
                <span className="basis-full text-sm text-muted">
                  {review.treatment} · {review.branch}
                </span>
              </figcaption>
            </motion.figure>
          </AnimatePresence>
        </div>
      </div>

      <div className="mt-5 flex items-center justify-between gap-4">
        <p className="text-sm text-muted tabular-nums">
          {activeIndex + 1} / {reviews.length}
        </p>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => move(-1)}
            aria-label="Previous patient review"
            className="flex size-11 items-center justify-center rounded-full border border-ink/20 text-ink transition-colors hover:border-teal hover:text-teal focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal"
          >
            <span aria-hidden="true">←</span>
          </button>
          <button
            type="button"
            onClick={() => move(1)}
            aria-label="Next patient review"
            className="flex size-11 items-center justify-center rounded-full border border-ink/20 text-ink transition-colors hover:border-teal hover:text-teal focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal"
          >
            <span aria-hidden="true">→</span>
          </button>
        </div>
      </div>
    </div>
  );
}

function BeforeAfterComparison() {
  const [position, setPosition] = useState(50);
  const frameRef = useRef<HTMLDivElement>(null);

  const updateFromPointer = (clientX: number) => {
    const frame = frameRef.current;
    if (!frame) return;
    const bounds = frame.getBoundingClientRect();
    const next = ((clientX - bounds.left) / bounds.width) * 100;
    setPosition(Math.min(96, Math.max(4, next)));
  };

  const handlePointerDown = (event: PointerEvent<HTMLDivElement>) => {
    event.currentTarget.setPointerCapture(event.pointerId);
    updateFromPointer(event.clientX);
  };

  const handlePointerMove = (event: PointerEvent<HTMLDivElement>) => {
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      updateFromPointer(event.clientX);
    }
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
    event.preventDefault();
    setPosition((current) =>
      Math.min(
        96,
        Math.max(4, current + (event.key === "ArrowRight" ? 2 : -2)),
      ),
    );
  };

  return (
    <div>
      <div
        ref={frameRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        className="relative aspect-3/2 touch-none cursor-ew-resize overflow-hidden rounded-[2rem] bg-sand ring-1 ring-ink/10 select-none"
      >
        <Image
          src="/gallery/whitening-before.svg"
          alt="Illustrated smile before professional teeth whitening."
          fill
          sizes="(min-width: 1024px) 600px, 100vw"
          className="pointer-events-none object-cover"
        />

        <div
          aria-hidden="true"
          className="absolute inset-0"
          style={{ clipPath: `inset(0 ${100 - position}% 0 0)` }}
        >
          <Image
            src="/gallery/whitening-after.svg"
            alt=""
            fill
            sizes="(min-width: 1024px) 600px, 100vw"
            className="pointer-events-none object-cover"
          />
        </div>

        <span className="absolute top-4 left-4 rounded-full bg-ink/80 px-3 py-1.5 text-xs font-semibold text-cream backdrop-blur-sm">
          After
        </span>
        <span className="absolute top-4 right-4 rounded-full bg-ink/80 px-3 py-1.5 text-xs font-semibold text-cream backdrop-blur-sm">
          Before
        </span>

        <div
          className="pointer-events-none absolute inset-y-0 w-0.5 bg-cream shadow-xl"
          style={{ left: `${position}%` }}
        />
        <div
          role="slider"
          tabIndex={0}
          aria-label="Reveal whitening result"
          aria-valuemin={4}
          aria-valuemax={96}
          aria-valuenow={Math.round(position)}
          aria-valuetext={`${Math.round(position)} percent after treatment visible`}
          onKeyDown={handleKeyDown}
          className="absolute top-1/2 flex size-12 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-cream text-teal shadow-xl ring-1 ring-ink/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal"
          style={{ left: `${position}%` }}
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
            className="size-6"
          >
            <path d="m8 8-4 4 4 4M16 8l4 4-4 4M4 12h16" />
          </svg>
        </div>
      </div>

      <div className="mt-5 flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="font-display text-xl font-semibold text-ink">
            Professional teeth whitening
          </p>
          <p className="mt-1 text-sm text-muted">
            Drag the handle or use the arrow keys to compare.
          </p>
        </div>
        <span className="rounded-full bg-mint px-3 py-1.5 text-xs font-semibold text-teal">
          1 visit
        </span>
      </div>
      <p className="mt-4 text-xs leading-relaxed text-muted">
        Illustrative treatment visualization, not patient photography.
        Individual results vary after clinical assessment.
      </p>
    </div>
  );
}

export function SocialProofGallery() {
  return (
    <section id="reviews" className="border-y border-ink/10 bg-sand/40">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20 lg:py-28">
        <div className="max-w-3xl">
          <p className="flex items-center gap-3 text-xs font-semibold tracking-[0.28em] text-teal uppercase">
            <span aria-hidden="true" className="h-px w-8 bg-teal/40" />
            Patient Stories
          </p>
          <h2 className="mt-5 font-display text-3xl leading-[1.1] font-semibold tracking-[0.01em] text-ink uppercase sm:text-4xl lg:text-5xl">
            Care you can see and feel.
          </h2>
          <p className="mt-6 max-w-2xl leading-relaxed text-muted">
            Verified feedback from recent visits, paired with a clear look at
            what a treatment can change.
          </p>
        </div>

        <div className="mt-10 grid gap-10 sm:mt-14 lg:grid-cols-[0.95fr_1.05fr] lg:items-stretch lg:gap-12">
          <ReviewCarousel />
          <BeforeAfterComparison />
        </div>
        <p className="mt-8 text-xs leading-relaxed text-muted">
          Testimonial copy is sample content for layout review. Replace it with
          consented, clinic-verified feedback before public launch.
        </p>
      </div>
    </section>
  );
}
