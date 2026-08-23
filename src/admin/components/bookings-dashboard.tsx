"use client";

import { Fragment, useEffect, useRef, useState, useTransition } from "react";
import { usePathname, useRouter } from "next/navigation";
import { ProofThumbnails } from "@/admin/components/proof-thumbnails";
import { RejectDialog } from "@/admin/components/reject-dialog";
import type {
  AdminBooking,
  AdminBookingQuery,
  AdminBookingStatus,
} from "@/admin/types";

const fieldClass =
  "min-h-11 w-full rounded-xl border border-ink/15 bg-cream px-4 py-2.5 text-base text-ink focus-visible:border-teal focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal sm:text-sm";

const approveClass =
  "inline-flex min-h-11 items-center justify-center rounded-full bg-teal px-4 text-sm font-semibold text-cream transition-colors hover:bg-teal-dark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal disabled:cursor-not-allowed disabled:opacity-70";

const rejectClass =
  "inline-flex min-h-11 items-center justify-center rounded-full border border-ink/20 px-4 text-sm font-semibold text-ink transition-colors hover:border-teal hover:text-teal focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal disabled:cursor-not-allowed disabled:opacity-70";

const termClass =
  "text-xs font-semibold tracking-[0.16em] text-muted uppercase";

const STATUS_LABEL: Record<AdminBookingStatus, string> = {
  pending: "Pending",
  approved: "Approved",
  rejected: "Rejected",
};

const STATUS_CLASS: Record<AdminBookingStatus, string> = {
  pending: "bg-mint text-teal",
  approved: "bg-teal text-cream",
  rejected: "bg-sand text-muted ring-1 ring-ink/10",
};

function formatVisit(date: string, time: string) {
  if (!date) return time;
  const parsed = new Date(`${date}T${time || "00:00"}:00+08:00`);
  if (Number.isNaN(parsed.getTime())) return `${date} ${time}`;
  return new Intl.DateTimeFormat("en-PH", {
    timeZone: "Asia/Manila",
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(parsed);
}

function formatSubmitted(iso: string) {
  if (!iso) return "";
  const parsed = new Date(iso);
  if (Number.isNaN(parsed.getTime())) return iso;
  return new Intl.DateTimeFormat("en-PH", {
    timeZone: "Asia/Manila",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(parsed);
}

function toSearchParams(query: AdminBookingQuery) {
  const params = new URLSearchParams();
  params.set(
    "status",
    query.status && query.status !== "all" ? query.status : "pending",
  );
  if (query.q) params.set("q", query.q);
  if (query.branch) params.set("branch", query.branch);
  if (query.sort) params.set("sort", query.sort);
  return params;
}

function StatusChip({ status }: { status: AdminBookingStatus }) {
  return (
    <span
      className={`inline-flex shrink-0 rounded-full px-3 py-1 text-xs font-semibold ${STATUS_CLASS[status]}`}
    >
      {STATUS_LABEL[status]}
    </span>
  );
}

function NewPatientChip() {
  return (
    <span className="inline-flex shrink-0 rounded-full bg-mint/60 px-2 py-0.5 text-xs font-semibold text-teal">
      New patient
    </span>
  );
}

/**
 * Front desk is checking the uploaded card against what the patient typed, so
 * the provider and member ID have to sit next to the coverage type.
 */
function Coverage({ booking }: { booking: AdminBooking }) {
  if (booking.coverageType !== "hmo") {
    return <span className="text-ink">Self-pay</span>;
  }
  return (
    <div className="text-ink">
      <p className="wrap-break-word">
        HMO · {booking.hmoProvider ?? "Provider not given"}
      </p>
      <p className="mt-1 wrap-break-word text-muted tabular-nums">
        {booking.hmoMemberId ?? "No member ID"}
      </p>
    </div>
  );
}

export function AdminBookingsDashboard({
  initialItems,
  initialQuery,
  branches,
}: {
  initialItems: AdminBooking[];
  initialQuery: AdminBookingQuery;
  branches: { id: string; name: string }[];
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [items, setItems] = useState(initialItems);
  const [query, setQuery] = useState(initialQuery);
  const [search, setSearch] = useState(initialQuery.q ?? "");
  const [error, setError] = useState<string>();
  const [busyId, setBusyId] = useState<string>();
  const [rejectTarget, setRejectTarget] = useState<AdminBooking | null>(null);
  const [rejectError, setRejectError] = useState<string>();
  const [loading, setLoading] = useState(false);
  const [, startTransition] = useTransition();

  // The text box settles into the query; a functional update keeps whatever
  // branch or sort was chosen while the user was still typing.
  useEffect(() => {
    const handle = window.setTimeout(() => {
      const next = search.trim() || undefined;
      setQuery((current) =>
        current.q === next ? current : { ...current, q: next },
      );
    }, 280);
    return () => window.clearTimeout(handle);
  }, [search]);

  const firstRender = useRef(true);

  // Every filter change funnels through here, so results can never arrive out
  // of order: a superseded request is aborted before its response can land and
  // overwrite the list with matches for a term the user already moved past.
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }

    const controller = new AbortController();
    const qs = toSearchParams(query).toString();
    setLoading(true);
    startTransition(() => {
      router.replace(qs ? `${pathname}?${qs}` : pathname);
    });

    fetch(`/api/v1/admin/bookings?${qs}`, {
      cache: "no-store",
      signal: controller.signal,
    })
      .then(async (response) => {
        const body = (await response.json()) as {
          items?: AdminBooking[];
          detail?: string;
        };
        if (!response.ok) {
          setError(body.detail ?? "Could not refresh the queue.");
          return;
        }
        setItems(body.items ?? []);
        setError(undefined);
      })
      .catch((cause: unknown) => {
        if (cause instanceof DOMException && cause.name === "AbortError")
          return;
        setError("Could not refresh the queue.");
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
  }, [query, pathname, router]);

  function applyQuery(next: AdminBookingQuery) {
    setQuery(next);
  }

  async function decide(
    booking: AdminBooking,
    action: "approve" | "reject",
    reason?: string,
  ) {
    const previous = items;
    setBusyId(booking.id);
    setError(undefined);
    setItems((current) =>
      current.map((row) =>
        row.id === booking.id
          ? {
              ...row,
              status: action === "approve" ? "approved" : "rejected",
              reviewNote: reason,
            }
          : row,
      ),
    );

    try {
      const response = await fetch(
        `/api/v1/admin/bookings/${encodeURIComponent(booking.id)}/${action}`,
        {
          method: "POST",
          headers:
            action === "reject"
              ? { "Content-Type": "application/json" }
              : undefined,
          body: action === "reject" ? JSON.stringify({ reason }) : undefined,
        },
      );
      const body = (await response.json()) as AdminBooking & {
        detail?: string;
      };
      if (!response.ok) {
        setItems(previous);
        const message = body.detail ?? "That action did not complete.";
        if (action === "reject") setRejectError(message);
        else setError(message);
        return;
      }
      setItems((current) =>
        current.map((row) => (row.id === booking.id ? body : row)),
      );
      setRejectTarget(null);
      setRejectError(undefined);
    } catch {
      setItems(previous);
      setError("That action did not complete.");
    } finally {
      setBusyId(undefined);
    }
  }

  function openReject(booking: AdminBooking) {
    setRejectError(undefined);
    setRejectTarget(booking);
  }

  return (
    <div className="space-y-6">
      <form
        className="grid gap-3 sm:grid-cols-2 lg:grid-cols-[1fr_14rem_14rem]"
        onSubmit={(event) => event.preventDefault()}
      >
        <label className="block sm:col-span-2 lg:col-span-1">
          <span className="mb-1.5 flex items-center gap-2 text-sm font-medium text-ink">
            Search
            {loading ? (
              <span className="text-xs font-normal text-muted" role="status">
                Searching…
              </span>
            ) : null}
          </span>
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.currentTarget.value)}
            placeholder="Name, mobile, email, reference, branch, service, HMO, or date"
            className={fieldClass}
          />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-ink">
            Branch
          </span>
          <select
            className={fieldClass}
            value={query.branch ?? ""}
            onChange={(event) =>
              applyQuery({
                ...query,
                branch: event.currentTarget.value || undefined,
              })
            }
          >
            <option value="">All branches</option>
            {branches.map((branch) => (
              <option key={branch.id} value={branch.id}>
                {branch.name}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-ink">
            Sort by visit
          </span>
          <select
            className={fieldClass}
            value={query.sort ?? "date_desc"}
            onChange={(event) =>
              applyQuery({
                ...query,
                sort: event.currentTarget.value as AdminBookingQuery["sort"],
              })
            }
          >
            <option value="date_desc">Newest first</option>
            <option value="date_asc">Soonest first</option>
          </select>
        </label>
      </form>

      {error ? (
        <p className="text-sm text-teal-dark" role="alert">
          {error}
        </p>
      ) : null}

      {items.length === 0 ? (
        <div className="rounded-2xl bg-cream p-6 ring-1 ring-ink/10 sm:p-8">
          {query.q ? (
            <>
              <p className="text-sm text-muted sm:text-base">
                Nothing matches{" "}
                <span className="font-semibold text-ink">
                  &ldquo;{query.q}&rdquo;
                </span>
                . Try a surname, mobile number, reference, or HMO member ID.
              </p>
              <button
                type="button"
                onClick={() => setSearch("")}
                className="mt-4 inline-flex min-h-11 items-center rounded-full border border-ink/20 px-4 text-sm font-semibold text-ink transition-colors hover:border-teal hover:text-teal focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal"
              >
                Clear search
              </button>
            </>
          ) : (
            <p className="text-sm text-muted sm:text-base">
              No bookings match these filters. New website requests appear here
              as pending.
            </p>
          )}
        </div>
      ) : (
        <div className={loading ? "opacity-60 transition-opacity" : undefined}>
          <ul className="space-y-4 xl:hidden">
            {items.map((booking) => (
              <li
                key={booking.id}
                className="rounded-2xl bg-cream p-5 ring-1 ring-ink/10"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                      <p className="font-semibold wrap-break-word text-ink">
                        {booking.patientName}
                      </p>
                      {booking.isNewPatient ? <NewPatientChip /> : null}
                    </div>
                    <p className="mt-1 text-xs text-muted">
                      <span className="tabular-nums">{booking.id}</span> · sent{" "}
                      {formatSubmitted(booking.submittedAt)}
                    </p>
                  </div>
                  <StatusChip status={booking.status} />
                </div>

                <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
                  <div>
                    <dt className={termClass}>Visit</dt>
                    <dd className="mt-1 text-ink tabular-nums">
                      {formatVisit(
                        booking.appointmentDate,
                        booking.appointmentTime,
                      )}
                    </dd>
                  </div>
                  <div>
                    <dt className={termClass}>Branch</dt>
                    <dd className="mt-1 text-ink">{booking.branchName}</dd>
                  </div>
                  <div>
                    <dt className={termClass}>Service</dt>
                    <dd className="mt-1 text-ink">{booking.serviceName}</dd>
                  </div>
                  <div>
                    <dt className={termClass}>Contact</dt>
                    <dd className="mt-1 wrap-break-word text-ink">
                      <span className="tabular-nums">{booking.phone}</span>
                      <br />
                      {booking.email ?? "No email"}
                    </dd>
                  </div>
                  <div className="sm:col-span-2">
                    <dt className={termClass}>Coverage</dt>
                    <dd className="mt-1">
                      <Coverage booking={booking} />
                    </dd>
                  </div>
                  {booking.notes ? (
                    <div className="sm:col-span-2">
                      <dt className={termClass}>Patient notes</dt>
                      <dd className="mt-1 wrap-break-word text-ink">
                        {booking.notes}
                      </dd>
                    </div>
                  ) : null}
                </dl>

                <div className="mt-4">
                  <p className={termClass}>ID / HMO</p>
                  <div className="mt-2">
                    <ProofThumbnails proofs={booking.proofs} />
                  </div>
                </div>

                {booking.status === "pending" ? (
                  <div className="mt-5 flex flex-col gap-3 sm:flex-row">
                    <button
                      type="button"
                      disabled={busyId === booking.id}
                      onClick={() => void decide(booking, "approve")}
                      className={`flex-1 ${approveClass}`}
                    >
                      Approve
                    </button>
                    <button
                      type="button"
                      disabled={busyId === booking.id}
                      onClick={() => openReject(booking)}
                      className={`flex-1 ${rejectClass}`}
                    >
                      Reject
                    </button>
                  </div>
                ) : booking.reviewNote ? (
                  <p className="mt-4 text-sm text-muted">
                    {booking.reviewNote}
                  </p>
                ) : null}
              </li>
            ))}
          </ul>

          <div className="hidden overflow-x-auto rounded-2xl bg-cream ring-1 ring-ink/10 xl:block">
            <table className="w-full min-w-6xl text-left text-sm">
              {/*
                Widths are pinned so a long email or service name cannot starve
                the patient column; the browser's content-based sizing made the
                grid shift every time the filters changed the result set.
              */}
              <colgroup>
                <col className="w-[20%]" />
                <col className="w-[16%]" />
                <col className="w-[15%]" />
                <col className="w-[12%]" />
                <col className="w-[14%]" />
                <col className="w-[10%]" />
                <col className="w-[13%]" />
              </colgroup>
              <thead className="border-b border-ink/10 text-xs tracking-[0.16em] text-muted uppercase">
                <tr>
                  <th className="px-4 py-3 font-semibold">Patient</th>
                  <th className="px-4 py-3 font-semibold">Contact</th>
                  <th className="px-4 py-3 font-semibold">Visit</th>
                  <th className="px-4 py-3 font-semibold">Coverage</th>
                  <th className="px-4 py-3 font-semibold whitespace-nowrap">
                    ID / HMO
                  </th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {items.map((booking) => (
                  <Fragment key={booking.id}>
                    <tr
                      className={`align-top ${booking.notes ? "" : "border-b border-ink/5 last:border-0"}`}
                    >
                      <td className="px-4 py-4">
                        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                          <p className="font-semibold wrap-break-word text-ink">
                            {booking.patientName}
                          </p>
                          {booking.isNewPatient ? <NewPatientChip /> : null}
                        </div>
                        <p className="mt-1 text-xs text-muted">
                          <span className="tabular-nums">{booking.id}</span> ·
                          sent {formatSubmitted(booking.submittedAt)}
                        </p>
                      </td>
                      <td className="px-4 py-4 text-ink">
                        <p className="tabular-nums">{booking.phone}</p>
                        <p className="mt-1 wrap-break-word text-muted">
                          {booking.email ?? "No email"}
                        </p>
                      </td>
                      <td className="px-4 py-4 text-ink">
                        <p className="tabular-nums">
                          {formatVisit(
                            booking.appointmentDate,
                            booking.appointmentTime,
                          )}
                        </p>
                        <p className="mt-1 text-muted">{booking.branchName}</p>
                        <p className="mt-1 text-muted">{booking.serviceName}</p>
                      </td>
                      <td className="px-4 py-4">
                        <Coverage booking={booking} />
                      </td>
                      <td className="px-4 py-4">
                        <ProofThumbnails proofs={booking.proofs} />
                      </td>
                      <td className="px-4 py-4">
                        <StatusChip status={booking.status} />
                      </td>
                      <td className="px-4 py-4">
                        {booking.status === "pending" ? (
                          <div className="flex w-full flex-col gap-2">
                            <button
                              type="button"
                              disabled={busyId === booking.id}
                              onClick={() => void decide(booking, "approve")}
                              className={approveClass}
                            >
                              Approve
                            </button>
                            <button
                              type="button"
                              disabled={busyId === booking.id}
                              onClick={() => openReject(booking)}
                              className={rejectClass}
                            >
                              Reject
                            </button>
                          </div>
                        ) : booking.reviewNote ? (
                          <p className="wrap-break-word text-xs text-muted">
                            {booking.reviewNote}
                          </p>
                        ) : (
                          <span className="text-xs text-muted">—</span>
                        )}
                      </td>
                    </tr>
                    {booking.notes ? (
                      <tr className="border-b border-ink/5 last:border-0">
                        <td colSpan={7} className="px-4 pb-4">
                          <p className={termClass}>Patient notes</p>
                          <p className="mt-1 max-w-4xl text-ink">
                            {booking.notes}
                          </p>
                        </td>
                      </tr>
                    ) : null}
                  </Fragment>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {rejectTarget ? (
        <RejectDialog
          patientName={rejectTarget.patientName}
          pending={busyId === rejectTarget.id}
          error={rejectError}
          onCancel={() => {
            if (busyId) return;
            setRejectTarget(null);
            setRejectError(undefined);
          }}
          onConfirm={(reason) => void decide(rejectTarget, "reject", reason)}
        />
      ) : null}
    </div>
  );
}
