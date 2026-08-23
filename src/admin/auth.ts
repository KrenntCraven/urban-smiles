"use server";

import { timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getIronSession } from "iron-session";
import { sessionOptions, type AdminSession } from "./session";

export async function getAdminSession() {
  return getIronSession<AdminSession>(await cookies(), sessionOptions());
}

export async function isAdminAuthenticated(): Promise<boolean> {
  const session = await getAdminSession();
  return session.authenticated === true;
}

export async function requireAdmin() {
  if (!(await isAdminAuthenticated())) {
    redirect("/admin/login");
  }
}

function passwordsMatch(provided: string, expected: string): boolean {
  const left = Buffer.from(provided);
  const right = Buffer.from(expected);
  if (left.length !== right.length) {
    timingSafeEqual(right, right);
    return false;
  }
  return timingSafeEqual(left, right);
}

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

export async function logoutAdmin() {
  const session = await getAdminSession();
  session.destroy();
  redirect("/admin/login");
}
