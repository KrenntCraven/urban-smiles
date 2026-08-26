/**
 * JSON error helper for admin API routes.
 * CalendarInviteError and RejectEmailError keep their message for the dashboard.
 */
import { NextResponse } from "next/server";
import { AdminServiceError } from "./service";
import { FastApiError } from "./fastapi";
import { CalendarInviteError } from "@/lib/calendar/google";
import { RejectEmailError } from "@/lib/email/errors";

/** Maps known admin/calendar errors to `{ detail }` JSON; logs anything else. */
export function jsonError(error: unknown) {
  if (
    error instanceof AdminServiceError ||
    error instanceof FastApiError ||
    error instanceof CalendarInviteError ||
    error instanceof RejectEmailError
  ) {
    return NextResponse.json(
      { detail: error.message },
      { status: error.status },
    );
  }
  console.error(error);
  return NextResponse.json(
    { detail: "Something went wrong." },
    { status: 500 },
  );
}
