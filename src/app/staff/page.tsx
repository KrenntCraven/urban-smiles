import { isStaffAuthenticated, logoutStaff } from "@/lib/booking/actions";
import { listBookings } from "@/lib/booking/store";
import { StaffLoginForm } from "@/components/staff/staff-login-form";
import { StaffQueue } from "@/components/staff/staff-queue";

export const metadata = {
  title: "Verification queue — Urban Smiles",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function StaffPage() {
  const signedIn = await isStaffAuthenticated();

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 sm:py-16">
      <p className="flex items-center gap-3 text-xs font-semibold tracking-[0.28em] text-teal uppercase">
        <span aria-hidden="true" className="h-px w-8 bg-teal/40" />
        Staff
      </p>
      <h1 className="mt-5 font-display text-4xl font-semibold tracking-tight text-ink">
        Appointment verification
      </h1>
      <p className="mt-4 max-w-xl leading-relaxed text-muted">
        New website bookings arrive here as pending verification. Review the
        uploaded ID or HMO card, then approve or reject.
      </p>

      <div className="mt-10">
        {signedIn ? (
          <>
            <form action={logoutStaff} className="mb-8">
              <button
                type="submit"
                className="text-sm font-semibold text-teal hover:text-teal-dark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal"
              >
                Sign out
              </button>
            </form>
            <StaffQueue bookings={listBookings()} />
          </>
        ) : (
          <div className="max-w-sm rounded-2xl bg-cream p-6 ring-1 ring-ink/10 sm:p-8">
            <StaffLoginForm />
            <p className="mt-4 text-xs text-muted">
              Set <span className="font-semibold text-ink">STAFF_PIN</span> in
              the environment. This page is not linked from the public site.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
