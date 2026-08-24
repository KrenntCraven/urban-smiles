"use client";

import type {
  AdminBookingQuery,
  AdminBookingStatus,
  AdminBookingSummary,
  AdminBranchSummary,
} from "@/admin/types";

const STATUS_CARDS: {
  status: AdminBookingStatus;
  label: string;
  hint: string;
}[] = [
  {
    status: "pending",
    label: "Pending",
    hint: "Waiting on ID or HMO review",
  },
  {
    status: "approved",
    label: "Approved",
    hint: "Visit confirmed automatically",
  },
  {
    status: "rejected",
    label: "Rejected",
    hint: "Patient asked to resubmit",
  },
];

const DECISION_PERIODS = [
  { key: "week", label: "This week" },
  { key: "month", label: "This month" },
  { key: "year", label: "This year" },
] as const;

function share(part: number, total: number): string {
  if (total <= 0 || part <= 0) return "0%";
  return `${Math.round((part / total) * 100)}%`;
}

function BranchBar({ branch }: { branch: AdminBranchSummary }) {
  if (branch.total === 0) {
    return <div className="h-2 rounded-full bg-ink/10" aria-hidden="true" />;
  }

  return (
    <div
      className="flex h-2 overflow-hidden rounded-full bg-ink/10"
      aria-hidden="true"
    >
      {branch.pending > 0 ? (
        <span
          className="h-full bg-mint"
          style={{ width: share(branch.pending, branch.total) }}
        />
      ) : null}
      {branch.approved > 0 ? (
        <span
          className="h-full bg-teal"
          style={{ width: share(branch.approved, branch.total) }}
        />
      ) : null}
      {branch.rejected > 0 ? (
        <span
          className="h-full bg-ink/25"
          style={{ width: share(branch.rejected, branch.total) }}
        />
      ) : null}
    </div>
  );
}

export function VerificationOverview({
  summary,
  query,
  onFilter,
}: {
  summary: AdminBookingSummary;
  query: AdminBookingQuery;
  onFilter: (next: AdminBookingQuery) => void;
}) {
  const selectedStatus =
    query.status && query.status !== "all" ? query.status : undefined;

  return (
    <section aria-label="Verification dashboard" className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-3">
        {STATUS_CARDS.map((card) => {
          const selected = selectedStatus === card.status;
          return (
            <button
              key={card.status}
              type="button"
              aria-pressed={selected}
              onClick={() =>
                onFilter({
                  ...query,
                  status: selected ? "all" : card.status,
                })
              }
              className={`rounded-2xl p-5 text-left ring-1 transition-shadow focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal ${
                selected
                  ? "bg-mint/50 ring-teal/40"
                  : "bg-cream ring-ink/10 hover:shadow-lg hover:shadow-ink/5"
              }`}
            >
              <p className="text-xs font-semibold tracking-[0.28em] text-teal uppercase">
                {card.label}
              </p>
              <p className="mt-2 font-display text-3xl font-semibold leading-[1.1] text-ink tabular-nums">
                {summary[card.status]}
              </p>
              <p className="mt-1 text-sm text-muted">{card.hint}</p>
            </button>
          );
        })}
      </div>

      <div className="rounded-2xl bg-cream p-5 ring-1 ring-ink/10 sm:p-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-xs font-semibold tracking-[0.28em] text-teal uppercase">
              By branch
            </p>
            <h2 className="mt-2 font-display text-xl font-semibold tracking-tight text-ink">
              Which clinic has more requests
            </h2>
          </div>
          <p className="text-sm text-muted tabular-nums">
            {summary.total} total
          </p>
        </div>

        <ul className="mt-5 space-y-3">
          {summary.branches.map((branch) => {
            const selected = query.branch === branch.id;
            const busiest =
              summary.busiestTotal > 0 && branch.total === summary.busiestTotal;

            return (
              <li key={branch.id}>
                <button
                  type="button"
                  aria-pressed={selected}
                  onClick={() =>
                    onFilter({
                      ...query,
                      branch: selected ? undefined : branch.id,
                    })
                  }
                  className={`w-full rounded-2xl p-4 text-left ring-1 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal ${
                    selected
                      ? "bg-mint/40 ring-teal/40"
                      : "ring-ink/10 hover:bg-sand/40"
                  }`}
                >
                  <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
                    <p className="font-semibold text-ink">{branch.name}</p>
                    <div className="flex items-center gap-2">
                      {busiest ? (
                        <span className="rounded-full bg-mint px-2.5 py-0.5 text-xs font-semibold text-teal">
                          Most requests
                        </span>
                      ) : null}
                      <span className="text-sm font-semibold text-ink tabular-nums">
                        {branch.total}
                      </span>
                    </div>
                  </div>
                  <div className="mt-3">
                    <BranchBar branch={branch} />
                  </div>
                  <p className="mt-2 text-xs text-muted tabular-nums">
                    {branch.pending} pending · {branch.approved} approved ·{" "}
                    {branch.rejected} rejected
                  </p>
                </button>
              </li>
            );
          })}
        </ul>
      </div>

      <div className="rounded-2xl bg-cream p-5 ring-1 ring-ink/10 sm:p-6">
        <p className="text-xs font-semibold tracking-[0.28em] text-teal uppercase">
          Decisions over time
        </p>
        <h2 className="mt-2 font-display text-xl font-semibold tracking-tight text-ink">
          Approved and rejected this week, month, and year
        </h2>
        <ul className="mt-5 grid gap-3 sm:grid-cols-3">
          {DECISION_PERIODS.map(({ key, label }) => {
            const period = summary.periods[key];
            return (
              <li key={key} className="rounded-2xl p-4 ring-1 ring-ink/10">
                <p className="text-xs font-semibold tracking-[0.16em] text-muted uppercase">
                  {label}
                </p>
                <dl className="mt-3 space-y-2 text-sm">
                  <div className="flex items-baseline justify-between gap-3">
                    <dt className="text-muted">Approved</dt>
                    <dd className="font-semibold text-ink tabular-nums">
                      {period.approved}
                    </dd>
                  </div>
                  <div className="flex items-baseline justify-between gap-3">
                    <dt className="text-muted">Rejected</dt>
                    <dd className="font-semibold text-ink tabular-nums">
                      {period.rejected}
                    </dd>
                  </div>
                </dl>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
