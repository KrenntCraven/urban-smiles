/**
 * Route handlers mounted at /api/v1/admin/bookings/*.
 * Cookie auth first; then list / approve (invite) / reject / file download.
 */
import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/admin/auth";
import { jsonError } from "@/admin/http";
import {
  approveAdminBooking,
  listAdminBookings,
  parseAdminQuery,
  readAdminDocument,
  rejectAdminBooking,
} from "@/admin/service";
import type { DocumentKind } from "@/lib/booking/records";

/** Cookie-gated list used by the dashboard fetch. */
export async function listBookings(request: Request) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ detail: "Unauthorized" }, { status: 401 });
  }

  try {
    const query = parseAdminQuery(new URL(request.url).searchParams);
    const result = await listAdminBookings(query);
    return NextResponse.json(result);
  } catch (error) {
    return jsonError(error);
  }
}

/** POST approve — invite then persist; failures stay pending. */
export async function approveBooking(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ detail: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await context.params;
    const booking = await approveAdminBooking(id);
    return NextResponse.json(booking);
  } catch (error) {
    return jsonError(error);
  }
}

/** POST reject — requires a short reason, no calendar event. */
export async function rejectBooking(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ detail: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await context.params;
    const body = (await request.json().catch(() => ({}))) as {
      reason?: string;
    };
    const booking = await rejectAdminBooking(id, body.reason ?? "");
    return NextResponse.json(booking);
  } catch (error) {
    return jsonError(error);
  }
}

/** GET ID/HMO bytes for the lightbox (admin cookie required). */
export async function bookingFile(
  _request: Request,
  context: { params: Promise<{ id: string; kind: string }> },
) {
  if (!(await isAdminAuthenticated())) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  try {
    const { id, kind } = await context.params;
    const file = await readAdminDocument(id, kind as DocumentKind);
    if (!file) {
      return new NextResponse("Not found", { status: 404 });
    }

    return new NextResponse(Buffer.from(file.bytes), {
      headers: {
        "Content-Type": file.mimeType,
        "Content-Disposition": `inline; filename="${file.filename}"`,
        "Cache-Control": "private, no-store",
      },
    });
  } catch (error) {
    return jsonError(error);
  }
}
