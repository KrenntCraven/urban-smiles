import type { Metadata } from "next";
import { AdminBookingsDashboard } from "@/admin/components/bookings-dashboard";
import {
  adminBranches,
  listAdminBookings,
  parseAdminQuery,
} from "@/admin/service";
import { calendarConfigured } from "@/lib/calendar/google";

/** /admin/bookings — loads the queue and whether Google Calendar is configured. */

export const adminBookingsMetadata: Metadata = {
  title: "Appointment verification — Urban Smiles",
  robots: { index: false, follow: false },
};

export async function AdminBookingsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const raw = await searchParams;
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(raw)) {
    if (typeof value === "string" && value) params.set(key, value);
  }

  const query = parseAdminQuery(params);
  const { items, summary } = await listAdminBookings(query);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10">
      <h1 className="font-display text-2xl font-semibold tracking-tight text-ink sm:text-3xl">
        Appointment verification
      </h1>
      <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted sm:text-base">
        Review government IDs and HMO cards. Approving sends a Gmail calendar
        invite in the patient&apos;s name and only then marks the visit
        confirmed.
      </p>
      <div className="mt-6 sm:mt-8">
        <AdminBookingsDashboard
          initialItems={items}
          initialQuery={query}
          initialSummary={summary}
          branches={adminBranches()}
          calendarReady={calendarConfigured()}
        />
      </div>
    </div>
  );
}
