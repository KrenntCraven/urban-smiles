"use client";

/**
 * Service-page CTA. Desktop can open the shared form in a dialog; mobile
 * goes to /book with the service pre-selected so nested scroll is avoided.
 */
import Link from "next/link";
import { useCallback, useEffect, useId, useRef, useState } from "react";
import type { MouseEvent } from "react";
import { AppointmentForm } from "./appointment-form";
import { buildBookingHref } from "@/lib/booking/schema";
import type { ServiceOption } from "@/lib/services/types";

export function BookServiceButton({
  serviceSlug,
  serviceName,
  services,
  label = "Book This Service",
  className = "",
}: {
  serviceSlug: string;
  serviceName: string;
  services: ServiceOption[];
  label?: string;
  className?: string;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [isOpen, setIsOpen] = useState(false);
  const titleId = useId();

  const close = useCallback(() => dialogRef.current?.close(), []);

  // Falls back to a full navigation to /book when the dialog element is
  // unavailable, so the CTA still works without JS or in older browsers.
  const handleClick = useCallback((event: MouseEvent<HTMLAnchorElement>) => {
    if (
      event.defaultPrevented ||
      event.button !== 0 ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey
    ) {
      return;
    }

    const dialog = dialogRef.current;
    if (typeof dialog?.showModal !== "function") return;

    // A long form inside a phone-sized dialog creates nested scrolling. Keep
    // the link's normal /book navigation on small screens; its href already
    // carries the selected service into the full-page mobile stepper.
    if (!window.matchMedia("(min-width: 768px)").matches) return;

    event.preventDefault();
    dialog.showModal();
    setIsOpen(true);
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [isOpen]);

  return (
    <>
      <Link
        href={buildBookingHref({ service: serviceSlug })}
        onClick={handleClick}
        className={
          className ||
          "inline-flex w-full items-center justify-center rounded-full bg-teal px-7 py-3.5 text-base font-semibold text-cream shadow-lg shadow-teal/20 transition-colors hover:bg-teal-dark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal"
        }
      >
        {label}
      </Link>

      <dialog
        ref={dialogRef}
        aria-labelledby={titleId}
        onClose={() => setIsOpen(false)}
        onClick={(event) => {
          if (event.target === dialogRef.current) close();
        }}
        className="m-auto max-h-[calc(100dvh-1rem)] w-[min(38rem,calc(100dvw-1rem))] max-w-none overscroll-contain overflow-y-auto rounded-[1.25rem] bg-cream p-0 text-ink shadow-2xl ring-1 ring-ink/10 backdrop:bg-ink/50 backdrop:backdrop-blur-sm sm:max-h-[calc(100dvh-3rem)] sm:w-[min(38rem,calc(100dvw-2rem))] sm:rounded-[1.75rem]"
      >
        <div className="flex items-start justify-between gap-6 border-b border-ink/10 px-6 py-5 sm:px-8">
          <div>
            <p className="text-xs font-semibold tracking-[0.28em] text-teal uppercase">
              Book an Appointment
            </p>
            <h2
              id={titleId}
              className="mt-1.5 font-display text-2xl font-semibold tracking-tight text-ink"
            >
              {serviceName}
            </h2>
          </div>
          <button
            type="button"
            onClick={close}
            aria-label="Close booking form"
            className="-mr-1 flex size-11 shrink-0 items-center justify-center rounded-full text-muted transition-colors hover:bg-sand hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal"
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

        <div className="px-6 pt-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] sm:px-8 sm:pb-6">
          {isOpen ? (
            <AppointmentForm services={services} defaults={{ serviceSlug }} />
          ) : null}
        </div>
      </dialog>
    </>
  );
}
