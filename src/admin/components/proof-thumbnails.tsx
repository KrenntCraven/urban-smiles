"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import type { AdminProof } from "@/admin/types";
import type { DocumentKind } from "@/lib/booking/records";

const PROOF_LABEL: Record<DocumentKind, string> = {
  hmoCardFront: "HMO front",
  hmoCardBack: "HMO back",
  governmentId: "Government ID",
};

const ZOOM_STEPS = [1, 1.5, 2, 3, 4] as const;

const toolButtonClass =
  "inline-flex size-11 shrink-0 items-center justify-center rounded-full text-teal transition-colors hover:bg-mint/50 hover:text-teal-dark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal disabled:cursor-not-allowed disabled:opacity-40";

export function ProofThumbnails({ proofs }: { proofs: AdminProof[] }) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  if (proofs.length === 0) {
    return <span className="text-sm text-muted">No file</span>;
  }

  return (
    <>
      <ul className="flex flex-wrap gap-2">
        {proofs.map((proof, index) => (
          <li key={proof.kind}>
            <button
              type="button"
              onClick={() => setOpenIndex(index)}
              title={PROOF_LABEL[proof.kind]}
              className="group block size-14 overflow-hidden rounded-lg ring-1 ring-ink/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal"
            >
              {/* eslint-disable-next-line @next/next/no-img-element -- admin cookie is not sent through the image optimizer */}
              <img
                src={proof.url}
                alt={`Open ${PROOF_LABEL[proof.kind]}`}
                className="size-full bg-sand object-cover transition-transform group-hover:scale-105"
              />
            </button>
          </li>
        ))}
      </ul>
      {openIndex !== null ? (
        <ProofLightbox
          proofs={proofs}
          index={openIndex}
          onIndex={setOpenIndex}
          onClose={() => setOpenIndex(null)}
        />
      ) : null}
    </>
  );
}

function ProofLightbox({
  proofs,
  index,
  onIndex,
  onClose,
}: {
  proofs: AdminProof[];
  index: number;
  onIndex: (index: number) => void;
  onClose: () => void;
}) {
  const titleId = useId();
  const closeRef = useRef<HTMLButtonElement>(null);
  const [zoomStep, setZoomStep] = useState(0);
  const [rotation, setRotation] = useState(0);
  const [failed, setFailed] = useState(false);

  const proof = proofs[index];
  const zoom = ZOOM_STEPS[zoomStep];
  const rotated = rotation % 180 !== 0;

  const show = useCallback(
    (next: number) => {
      // A different document deserves a fresh view rather than the previous
      // document's zoom and rotation.
      setZoomStep(0);
      setRotation(0);
      setFailed(false);
      onIndex((next + proofs.length) % proofs.length);
    },
    [onIndex, proofs.length],
  );

  useEffect(() => {
    closeRef.current?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
      if (event.key === "ArrowRight") show(index + 1);
      if (event.key === "ArrowLeft") show(index - 1);
    };
    document.addEventListener("keydown", onKey);
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = previous;
    };
  }, [onClose, show, index]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center overscroll-contain bg-ink/70 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur-sm sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      onClick={onClose}
    >
      <div
        className="flex max-h-[94dvh] w-full max-w-6xl flex-col overflow-hidden rounded-2xl bg-cream shadow-xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex shrink-0 flex-wrap items-center justify-between gap-x-3 gap-y-1 border-b border-ink/10 px-2 py-1.5 sm:px-3">
          <h2
            id={titleId}
            className="min-w-0 flex-1 truncate px-2 text-sm font-semibold text-ink"
          >
            {PROOF_LABEL[proof.kind]}
            {proofs.length > 1 ? (
              <span className="ml-2 font-normal text-muted tabular-nums">
                {index + 1} of {proofs.length}
              </span>
            ) : null}
          </h2>

          <div className="flex shrink-0 items-center">
            {proofs.length > 1 ? (
              <>
                <button
                  type="button"
                  onClick={() => show(index - 1)}
                  className={toolButtonClass}
                  aria-label="Previous document"
                >
                  <Icon path="m15 5-7 7 7 7" />
                </button>
                <button
                  type="button"
                  onClick={() => show(index + 1)}
                  className={toolButtonClass}
                  aria-label="Next document"
                >
                  <Icon path="m9 5 7 7-7 7" />
                </button>
                <span aria-hidden="true" className="mx-1 h-6 w-px bg-ink/10" />
              </>
            ) : null}

            <button
              type="button"
              onClick={() => setZoomStep((step) => Math.max(0, step - 1))}
              disabled={zoomStep === 0}
              className={toolButtonClass}
              aria-label="Zoom out"
            >
              <Icon path="M5 12h14" />
            </button>
            <span className="w-14 text-center text-xs font-semibold text-muted tabular-nums">
              {Math.round(zoom * 100)}%
            </span>
            <button
              type="button"
              onClick={() =>
                setZoomStep((step) => Math.min(ZOOM_STEPS.length - 1, step + 1))
              }
              disabled={zoomStep === ZOOM_STEPS.length - 1}
              className={toolButtonClass}
              aria-label="Zoom in"
            >
              <Icon path="M12 5v14M5 12h14" />
            </button>
            <button
              type="button"
              onClick={() => setRotation((value) => (value + 90) % 360)}
              className={toolButtonClass}
              aria-label="Rotate 90 degrees"
            >
              <Icon path="M20 5v6h-6M20 11a8 8 0 1 0-2.3 5.3" />
            </button>

            <span aria-hidden="true" className="mx-1 h-6 w-px bg-ink/10" />
            <button
              ref={closeRef}
              type="button"
              onClick={onClose}
              className={toolButtonClass}
              aria-label="Close preview"
            >
              <Icon path="m6 6 12 12M18 6 6 18" />
            </button>
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-auto overscroll-contain bg-ink/5">
          <div className="flex min-h-full min-w-full items-center justify-center p-3 sm:p-4">
            {failed ? (
              <p className="max-w-sm text-center text-sm leading-relaxed text-muted">
                This file could not be displayed. It may have been uploaded in a
                format the browser cannot render.
              </p>
            ) : (
              /* eslint-disable-next-line @next/next/no-img-element -- admin cookie is not sent through the image optimizer */
              <img
                src={proof.url}
                alt={`${PROOF_LABEL[proof.kind]} — ${proof.filename}`}
                draggable={false}
                onError={() => setFailed(true)}
                style={{
                  transform: `rotate(${rotation}deg)`,
                  // Past 100% the wrapper scrolls, which is what makes small
                  // photos of an ID actually readable.
                  width: zoom === 1 ? undefined : `${zoom * 100}%`,
                  maxWidth: zoom === 1 ? undefined : "none",
                }}
                className={`object-contain transition-transform ${
                  zoom > 1
                    ? ""
                    : rotated
                      ? "max-h-[70vmin] max-w-[70vmin]"
                      : "max-h-full max-w-full"
                }`}
              />
            )}
          </div>
        </div>

        <p className="shrink-0 truncate border-t border-ink/10 px-4 py-2 text-xs text-muted">
          {proof.filename}
        </p>
      </div>
    </div>
  );
}

function Icon({ path }: { path: string }) {
  return (
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
      <path d={path} />
    </svg>
  );
}
