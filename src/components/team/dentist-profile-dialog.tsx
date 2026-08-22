"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useId, useRef } from "react";
import {
  buildQuickBookingHref,
  getLocationName,
} from "@/lib/booking/schema";
import { dentistSpecialtyLabels, type Dentist } from "@/lib/team/types";

const sectionHeadingClass =
  "text-xs font-semibold tracking-[0.18em] text-muted uppercase";

export function DentistProfileDialog({
  dentist,
  onClose,
}: {
  dentist: Dentist | null;
  onClose: () => void;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();

  const close = useCallback(() => dialogRef.current?.close(), []);

  // Native `showModal` handles the focus trap and returns focus to the
  // triggering button on close, so the open state only mirrors the prop.
  useEffect(() => {
    const dialog = dialogRef.current;
    if (typeof dialog?.showModal !== "function") return;

    if (dentist && !dialog.open) dialog.showModal();
    if (!dentist && dialog.open) dialog.close();
  }, [dentist]);

  useEffect(() => {
    if (!dentist) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [dentist]);

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={titleId}
      onClose={onClose}
      onClick={(event) => {
        if (event.target === dialogRef.current) close();
      }}
      className="m-0 mt-auto max-h-[92dvh] w-full max-w-none overscroll-contain overflow-y-auto rounded-t-[1.5rem] bg-cream p-0 text-ink shadow-2xl ring-1 ring-ink/10 backdrop:bg-ink/50 backdrop:backdrop-blur-sm sm:m-auto sm:max-h-[calc(100dvh-3rem)] sm:w-[min(44rem,calc(100dvw-2rem))] sm:rounded-[1.75rem]"
    >
      {dentist ? (
        <>
          <div className="relative aspect-16/9 bg-sand sm:aspect-21/9">
            <Image
              src={dentist.photo}
              alt={dentist.photoAlt}
              fill
              sizes="(min-width: 640px) 704px, 100vw"
              className="object-cover"
            />
            <button
              type="button"
              onClick={close}
              aria-label={`Close profile for ${dentist.name}`}
              className="absolute top-3 right-3 flex size-11 items-center justify-center rounded-full bg-cream/90 text-ink shadow-lg shadow-ink/10 backdrop-blur-sm transition-colors hover:bg-cream focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal"
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
                className="size-5"
              >
                <path d="m6 6 12 12M18 6 6 18" />
              </svg>
            </button>
          </div>

          <div className="px-6 pt-6 sm:px-8 sm:pt-8">
            <p className="text-xs font-semibold tracking-[0.18em] text-teal uppercase">
              {dentist.specialties
                .map((specialty) => dentistSpecialtyLabels[specialty])
                .join(" · ")}
            </p>

            <h2
              id={titleId}
              className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-2 font-display text-3xl font-semibold tracking-tight text-ink"
            >
              {dentist.name}
              <span className="rounded-full bg-mint px-2.5 py-1 text-xs font-semibold tracking-[0.12em] text-teal uppercase">
                {dentist.credential}
              </span>
            </h2>

            <p className="mt-2 text-sm text-muted">
              {dentist.role} · Practicing since{" "}
              <span className="tabular-nums">{dentist.practicingSince}</span>
            </p>

            <p className="mt-5 leading-relaxed text-muted">
              {dentist.philosophy}
            </p>

            <div className="mt-8 grid gap-8 border-t border-ink/10 pt-8 sm:grid-cols-2">
              <section>
                <h3 className={sectionHeadingClass}>Education</h3>
                <ul className="mt-4 space-y-4">
                  {dentist.education.map((entry) => (
                    <li key={entry.qualification}>
                      <p className="font-semibold text-ink">
                        {entry.qualification}
                      </p>
                      <p className="mt-1 text-sm text-muted">
                        {entry.institution} ·{" "}
                        <span className="tabular-nums">{entry.year}</span>
                      </p>
                    </li>
                  ))}
                </ul>
              </section>

              <section>
                <h3 className={sectionHeadingClass}>Certifications</h3>
                <ul className="mt-4 space-y-3">
                  {dentist.certifications.map((certification) => (
                    <li
                      key={certification}
                      className="flex items-start gap-3 text-sm leading-relaxed text-muted"
                    >
                      <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.6"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        aria-hidden="true"
                        className="mt-0.5 size-5 shrink-0 text-teal"
                      >
                        <path d="M12 3 4.5 6v6c0 4.4 3.2 7.9 7.5 9 4.3-1.1 7.5-4.6 7.5-9V6L12 3Z" />
                        <path d="m9 12 2.2 2.2L15.4 10" />
                      </svg>
                      {certification}
                    </li>
                  ))}
                </ul>
              </section>

              <section>
                <h3 className={sectionHeadingClass}>Office hours</h3>
                <dl className="mt-4 space-y-3">
                  {dentist.officeHours.map((slot) => (
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
              </section>

              <section>
                <h3 className={sectionHeadingClass}>Branch assignment</h3>
                <p className="mt-4 font-semibold text-ink">
                  {getLocationName(dentist.branchId)}
                </p>
                <p className="mt-2 text-sm leading-relaxed text-muted">
                  Consultations with {dentist.name} are held at this branch.
                  Other branches are available for follow-up visits.
                </p>
              </section>
            </div>
          </div>

          <div className="mt-8 border-t border-ink/10 bg-sand/40 px-6 py-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] sm:px-8">
            <Link
              href={buildQuickBookingHref({
                service: dentist.defaultServiceSlug,
                dentist: dentist.slug,
                location: dentist.branchId,
              })}
              className="inline-flex w-full items-center justify-center rounded-full bg-teal px-7 py-3.5 text-base font-semibold text-cream shadow-lg shadow-teal/20 transition-colors hover:bg-teal-dark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal"
            >
              Book with {dentist.name}
            </Link>
            <p className="mt-3 text-center text-xs text-muted">
              Treatment and branch are pre-filled · No payment today
            </p>
          </div>
        </>
      ) : null}
    </dialog>
  );
}
