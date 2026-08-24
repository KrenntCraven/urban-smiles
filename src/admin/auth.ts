"use server";

/**
 * Admin sign-in and sign-out. Compares ADMIN_PASSWORD in constant time, then
 * seals the session cookie. requireAdmin() is for Server Components; API
 * routes use isAdminAuthenticated() and return 401 instead of redirecting.
 */
import { timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getIronSession } from "iron-session";
import { sessionOptions, type AdminSession } from "./session";

/** Opens (or creates) the sealed admin session from the incoming cookies. */
export async function getAdminSession() {
  return getIronSession<AdminSession>(await cookies(), sessionOptions());
}

/** True when the admin cookie is present and marked authenticated. */
export async function isAdminAuthenticated(): Promise<boolean> {
  const session = await getAdminSession();
  return session.authenticated === true;
}

/** Server-component guard: send unsigned visitors to /admin/login. */
export async function requireAdmin() {
  if (!(await isAdminAuthenticated())) {
    redirect("/admin/login");
  }
}

/** Avoids leaking ADMIN_PASSWORD length through a naive === compare. */
function passwordsMatch(provided: string, expected: string): boolean {
  const left = Buffer.from(provided);
  const right = Buffer.from(expected);
  if (left.length !== right.length) {
    timingSafeEqual(right, right);
    return false;
  }
  return timingSafeEqual(left, right);
}

/** Login form action. On success, cookie is set and the browser goes to /admin/bookings. */
export async function loginAdmin(
  _prev: { error?: string },
  formData: FormData,
): Promise<{ error?: string }> {
  const expected = process.env.ADMIN_PASSWORD?.trim() ?? "";
  if (!expected) {
    return {
      error: "Set ADMIN_PASSWORD in the environment before signing in.",
    };
  }

  const password = String(formData.get("password") ?? "");
  if (!passwordsMatch(password, expected)) {
    return { error: "That password is incorrect." };
  }

  const session = await getAdminSession();
  session.authenticated = true;
  await session.save();
  redirect("/admin/bookings");
}

/** Clears the admin cookie and returns to the login screen. */
export async function logoutAdmin() {
  const session = await getAdminSession();
  session.destroy();
  redirect("/admin/login");
}
