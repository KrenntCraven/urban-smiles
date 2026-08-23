import type { Metadata } from "next";
import { AdminLoginForm } from "@/admin/components/login-form";

export const adminLoginMetadata: Metadata = {
  title: "Admin sign in — Urban Smiles",
  robots: { index: false, follow: false },
};

export function AdminLoginPage() {
  return (
    <div className="flex flex-1 items-center justify-center px-4 py-12 sm:px-6 sm:py-16">
      <div className="w-full max-w-md">
        <p className="flex items-center gap-3 text-xs font-semibold tracking-[0.28em] text-teal uppercase">
          <span aria-hidden="true" className="h-px w-8 bg-teal/40" />
          Admin
        </p>
        <h1 className="mt-5 font-display text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
          Sign in to review bookings
        </h1>
        <p className="mt-4 leading-relaxed text-muted">
          Front desk verifies ID and HMO cards here. Approved visits confirm
          automatically.
        </p>
        <div className="mt-8 rounded-2xl bg-cream p-6 ring-1 ring-ink/10 sm:p-8">
          <AdminLoginForm />
          <p className="mt-4 text-xs text-muted">
            Set <span className="font-semibold text-ink">ADMIN_PASSWORD</span>{" "}
            in the environment. This page is not linked from the public site.
          </p>
        </div>
      </div>
    </div>
  );
}
