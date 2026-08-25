"use client";

/**
 * /staff queue: ID photos, approve (calendar invite) or reject with a note.
 */
import { useActionState } from "react";
import { reviewBooking } from "@/lib/booking/actions";
import { formatPatientName, getLocationName } from "@/lib/booking/schema";
import type { BookingRecord } from "@/lib/booking/records";

const statusLabel: Record<BookingRecord["status"], string> = {
  pending_verification: "Pending verification",
  approved: "Approved",
  rejected: "Rejected",
};

export function StaffQueue({ bookings }: { bookings: BookingRecord[] }) {
  if (bookings.length === 0) {
    return (
      <p className="rounded-2xl bg-cream p-8 text-muted ring-1 ring-ink/10">
        No booking requests yet. New website submissions appear here with status
        pending verification.
      </p>
    );
  }

  return (
    <ul className="space-y-6">
      {bookings.map((booking) => (
        <li
          key={booking.reference}
          className="rounded-2xl bg-cream p-6 ring-1 ring-ink/10 sm:p-8"
        >
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="font-display text-2xl font-semibold text-ink">
                {formatPatientName(booking.appointment)}
              </p>
              <p className="mt-1 text-sm text-muted tabular-nums">
                {booking.reference}
              </p>
            </div>
            <span className="rounded-full bg-mint px-3 py-1.5 text-xs font-semibold text-teal">
              {statusLabel[booking.status]}
            </span>
          </div>

          <dl className="mt-5 grid gap-3 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-xs font-semibold tracking-[0.18em] text-muted uppercase">
                Visit
              </dt>
              <dd className="mt-1 text-ink">
                {booking.appointment.preferredDate} ·{" "}
                {booking.appointment.preferredTime}
                <br />
                {getLocationName(booking.appointment.locationId)}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-semibold tracking-[0.18em] text-muted uppercase">
                Contact
              </dt>
              <dd className="mt-1 text-ink">
                {booking.appointment.phone}
                <br />
                {booking.appointment.email ?? "No email"}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-semibold tracking-[0.18em] text-muted uppercase">
                Coverage
              </dt>
              <dd className="mt-1 text-ink">
                {booking.appointment.coverageType === "hmo"
                  ? `${booking.appointment.hmoProvider} · ${booking.appointment.hmoMemberId}`
                  : "Self-pay"}
              </dd>
            </div>
          </dl>

          <ul className="mt-5 grid gap-4 sm:grid-cols-2">
            {booking.documents.map((document) => (
              <li key={document.kind}>
                {/* eslint-disable-next-line @next/next/no-img-element -- auth cookie is not sent through the image optimizer */}
                <img
                  src={`/staff/files/${booking.reference}/${document.kind}`}
                  alt={document.filename}
                  className="w-full rounded-2xl bg-sand object-cover ring-1 ring-ink/10"
                />
                <p className="mt-2 text-xs text-muted">{document.filename}</p>
              </li>
            ))}
          </ul>

          {booking.status === "pending_verification" ? (
            <ReviewActions reference={booking.reference} />
          ) : booking.review?.note ? (
            <p className="mt-5 text-sm text-muted">{booking.review.note}</p>
          ) : null}
        </li>
      ))}
    </ul>
  );
}

function ReviewActions({ reference }: { reference: string }) {
  const [state, action, isPending] = useActionState(reviewBooking, {});

  return (
    <form action={action} className="mt-6 space-y-3">
      <input type="hidden" name="reference" value={reference} />
      <label className="block">
        <span className="mb-1.5 block text-sm font-medium text-ink">
          Reason (required to reject)
        </span>
        <input
          type="text"
          name="note"
          className="min-h-11 w-full rounded-xl border border-ink/15 bg-cream px-4 py-3 text-base text-ink sm:text-sm"
        />
      </label>
      {state.error ? (
        <p className="text-sm text-teal-dark">{state.error}</p>
      ) : null}
      <div className="flex flex-col gap-3 sm:flex-row">
        <button
          type="submit"
          name="decision"
          value="approved"
          disabled={isPending}
          className="inline-flex min-h-11 flex-1 items-center justify-center rounded-full bg-teal px-6 font-semibold text-cream hover:bg-teal-dark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal disabled:opacity-70"
        >
          Approve
        </button>
        <button
          type="submit"
          name="decision"
          value="rejected"
          disabled={isPending}
          className="inline-flex min-h-11 flex-1 items-center justify-center rounded-full border border-ink/20 px-6 font-semibold text-ink hover:border-teal hover:text-teal focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal disabled:opacity-70"
        >
          Reject
        </button>
      </div>
    </form>
  );
}
