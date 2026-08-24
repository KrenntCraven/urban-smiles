import { logoutAdmin } from "@/admin/auth";

/** Signed-in chrome: clinic name + Sign out. */

export function AdminBookingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <header className="border-b border-ink/10 bg-cream">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <p className="font-display text-base font-semibold tracking-[0.16em] text-ink uppercase">
            Urban Smiles
          </p>
          <form action={logoutAdmin}>
            <button
              type="submit"
              className="inline-flex min-h-11 items-center rounded-full px-3 text-sm font-semibold text-teal transition-colors hover:text-teal-dark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal"
            >
              Sign out
            </button>
          </form>
        </div>
      </header>
      <main className="flex-1">{children}</main>
    </>
  );
}
