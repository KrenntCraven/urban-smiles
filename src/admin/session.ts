/**
 * Admin cookie session (iron-session).
 *
 * Sign-in writes `authenticated` onto an httpOnly cookie named us_admin.
 * Edge middleware in protect.ts reads the same seal, so login and route
 * guards share one password (ADMIN_PASSWORD / ADMIN_SESSION_SECRET).
 */
import type { SessionOptions } from "iron-session";

export const ADMIN_COOKIE = "us_admin";

export type AdminSession = {
  authenticated?: boolean;
};

/**
 * iron-session needs a password of at least 32 characters. Prefer
 * ADMIN_SESSION_SECRET in production; locally we derive a stable seal from
 * ADMIN_PASSWORD so Edge middleware never has to import node:crypto.
 */
export function sessionPassword(): string {
  const secret = process.env.ADMIN_SESSION_SECRET?.trim();
  if (secret && secret.length >= 32) return secret;

  const password = process.env.ADMIN_PASSWORD?.trim() ?? "";
  return `${password}::urban-smiles-admin-seal`.repeat(4).slice(0, 64);
}

export function sessionOptions(): SessionOptions {
  return {
    cookieName: ADMIN_COOKIE,
    password: sessionPassword(),
    ttl: 60 * 60 * 12,
    cookieOptions: {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
    },
  };
}
