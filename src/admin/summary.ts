import { clinicToday } from "@/lib/booking/schema";
import type {
  AdminBooking,
  AdminBookingStatus,
  AdminBookingSummary,
  AdminBranchSummary,
  AdminDecisionPeriod,
  AdminPeriodSummary,
  AdminStatusCounts,
} from "./types";

function emptyCounts(): AdminStatusCounts {
  return { pending: 0, approved: 0, rejected: 0, total: 0 };
}

function emptyDecisions(): AdminDecisionPeriod {
  return { approved: 0, rejected: 0 };
}

function emptyPeriods(): AdminPeriodSummary {
  return {
    week: emptyDecisions(),
    month: emptyDecisions(),
    year: emptyDecisions(),
  };
}

function sortBranches(branches: AdminBranchSummary[]): AdminBranchSummary[] {
  return [...branches].sort(
    (left, right) =>
      right.total - left.total || left.name.localeCompare(right.name),
  );
}

function busiestTotalOf(branches: AdminBranchSummary[]): number {
  return branches.reduce((max, branch) => Math.max(max, branch.total), 0);
}

function toClinicYmd(iso: string): string | undefined {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return undefined;
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Manila",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

function mondayOf(ymd: string): string {
  const noon = new Date(`${ymd}T12:00:00+08:00`);
  const daysFromMonday = (noon.getUTCDay() + 6) % 7;
  noon.setUTCDate(noon.getUTCDate() - daysFromMonday);
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Manila",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(noon);
}

function decisionYmd(booking: AdminBooking): string | undefined {
  if (booking.status !== "approved" && booking.status !== "rejected") {
    return undefined;
  }
  return toClinicYmd(booking.decidedAt || booking.submittedAt);
}

function bumpDecision(
  period: AdminDecisionPeriod,
  status: "approved" | "rejected",
) {
  period[status] += 1;
}

export function emptySummary(
  branches: { id: string; name: string }[],
): AdminBookingSummary {
  const rows = branches.map((branch) => ({ ...branch, ...emptyCounts() }));
  return {
    ...emptyCounts(),
    branches: rows,
    busiestTotal: 0,
    periods: emptyPeriods(),
  };
}

export function summarizeBookings(
  bookings: AdminBooking[],
  branches: { id: string; name: string }[],
  now: Date = new Date(),
): AdminBookingSummary {
  const byId = new Map<string, AdminBranchSummary>();
  for (const branch of branches) {
    byId.set(branch.id, { ...branch, ...emptyCounts() });
  }

  const today = toClinicYmd(now.toISOString()) ?? clinicToday();
  const weekStart = mondayOf(today);
  const periods = emptyPeriods();
  const overall = emptyCounts();

  for (const booking of bookings) {
    overall[booking.status] += 1;
    overall.total += 1;

    let row = byId.get(booking.branchId);
    if (!row) {
      row = {
        id: booking.branchId,
        name: booking.branchName || booking.branchId,
        ...emptyCounts(),
      };
      byId.set(booking.branchId, row);
    }
    row[booking.status] += 1;
    row.total += 1;

    const ymd = decisionYmd(booking);
    if (!ymd) continue;
    const status = booking.status as "approved" | "rejected";
    if (ymd.slice(0, 4) === today.slice(0, 4))
      bumpDecision(periods.year, status);
    if (ymd.slice(0, 7) === today.slice(0, 7)) {
      bumpDecision(periods.month, status);
    }
    if (ymd >= weekStart && ymd <= today) bumpDecision(periods.week, status);
  }

  const rows = sortBranches([...byId.values()]);
  return {
    ...overall,
    branches: rows,
    busiestTotal: busiestTotalOf(rows),
    periods,
  };
}

function shiftPeriod(
  period: AdminDecisionPeriod,
  from: AdminBookingStatus,
  to: AdminBookingStatus,
): AdminDecisionPeriod {
  const next = { ...period };
  if (from === "approved" || from === "rejected") {
    next[from] = Math.max(0, next[from] - 1);
  }
  if (to === "approved" || to === "rejected") {
    next[to] += 1;
  }
  return next;
}

export function applyStatusChange(
  summary: AdminBookingSummary,
  branchId: string,
  from: AdminBookingStatus,
  to: AdminBookingStatus,
): AdminBookingSummary {
  if (from === to) return summary;

  const branches = summary.branches.map((branch) => {
    if (branch.id !== branchId) return branch;
    return {
      ...branch,
      [from]: Math.max(0, branch[from] - 1),
      [to]: branch[to] + 1,
    };
  });

  const next: AdminBookingSummary = {
    pending: summary.pending,
    approved: summary.approved,
    rejected: summary.rejected,
    total: summary.total,
    branches: sortBranches(branches),
    busiestTotal: 0,
    periods: {
      week: shiftPeriod(summary.periods.week, from, to),
      month: shiftPeriod(summary.periods.month, from, to),
      year: shiftPeriod(summary.periods.year, from, to),
    },
  };
  next[from] = Math.max(0, next[from] - 1);
  next[to] += 1;
  next.busiestTotal = busiestTotalOf(next.branches);
  return next;
}
