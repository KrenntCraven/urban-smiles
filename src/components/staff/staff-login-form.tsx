"use client";

/**
 * /staff PIN form. Same pending queue as admin, lighter auth (STAFF_PIN).
 */
import { useActionState } from "react";
import { loginStaff } from "@/lib/booking/actions";

const inputClass =
  "min-h-11 w-full rounded-xl border border-ink/15 bg-cream px-4 py-3 text-base text-ink focus-visible:border-teal focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal sm:text-sm";

export function StaffLoginForm() {
  const [state, action, isPending] = useActionState(loginStaff, {});

  return (
    <form action={action} className="space-y-5">
      <label className="block">
        <span className="mb-1.5 block text-sm font-medium text-ink">
          Staff PIN
        </span>
        <input
          type="password"
          name="pin"
          autoComplete="current-password"
          className={inputClass}
        />
      </label>
      {state.error ? (
        <p className="text-sm text-teal-dark" role="alert">
          {state.error}
        </p>
      ) : null}
      <button
        type="submit"
        disabled={isPending}
        className="inline-flex min-h-11 w-full items-center justify-center rounded-full bg-teal px-7 text-base font-semibold text-cream hover:bg-teal-dark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal disabled:opacity-70"
      >
        {isPending ? "Checking…" : "Open verification queue"}
      </button>
    </form>
  );
}
