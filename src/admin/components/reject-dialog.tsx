"use client";

/**
 * Reason modal for Reject. The note is stored on the booking and can be shown
 * to the patient later; it is required (min 3 characters) on the server.
 */
import { useEffect, useId, useRef } from "react";

export function RejectDialog({
  patientName,
  pending,
  error,
  onCancel,
  onConfirm,
}: {
  patientName: string;
  pending: boolean;
  error?: string;
  onCancel: () => void;
  onConfirm: (reason: string) => void;
}) {
  const titleId = useId();
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !pending) onCancel();
    };
    document.addEventListener("keydown", onKey);
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = previous;
    };
  }, [onCancel, pending]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center overscroll-contain bg-ink/70 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur-sm sm:items-center sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
    >
      <form
        className="max-h-[90dvh] w-full max-w-md overflow-y-auto rounded-2xl bg-cream p-5 shadow-xl ring-1 ring-ink/10 sm:p-6"
        onSubmit={(event) => {
          event.preventDefault();
          const reason = String(
            new FormData(event.currentTarget).get("reason") ?? "",
          );
          onConfirm(reason);
        }}
      >
        <h2
          id={titleId}
          className="font-display text-xl font-semibold text-ink sm:text-2xl"
        >
          Reject this request?
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-muted">
          {patientName} will not be confirmed. Add a short reason for the
          record.
        </p>
        <label className="mt-5 block">
          <span className="mb-1.5 block text-sm font-medium text-ink">
            Reason
          </span>
          <textarea
            ref={inputRef}
            name="reason"
            required
            minLength={3}
            rows={3}
            className="min-h-24 w-full rounded-xl border border-ink/15 bg-cream px-4 py-3 text-base text-ink focus-visible:border-teal focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal sm:text-sm"
          />
        </label>
        {error ? (
          <p className="mt-2 text-sm text-teal-dark" role="alert">
            {error}
          </p>
        ) : null}
        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onCancel}
            disabled={pending}
            className="inline-flex min-h-11 items-center justify-center rounded-full border border-ink/20 px-6 text-sm font-semibold text-ink transition-colors hover:border-teal hover:text-teal focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal disabled:cursor-not-allowed disabled:opacity-70"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={pending}
            className="inline-flex min-h-11 items-center justify-center rounded-full bg-teal px-6 text-sm font-semibold text-cream transition-colors hover:bg-teal-dark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal disabled:cursor-not-allowed disabled:opacity-70"
          >
            {pending ? "Rejecting…" : "Reject request"}
          </button>
        </div>
      </form>
    </div>
  );
}
