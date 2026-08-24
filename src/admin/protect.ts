/**
 * Edge middleware for /admin and /api/v1/admin.
 *
 * Unauthenticated HTML goes to /admin/login. Unauthenticated API calls get 401.
 * Already-signed-in visits to /admin/login bounce to the bookings dashboard.
 */
import { getIronSession } from "iron-session";
import { NextResponse, type NextRequest } from "next/server";
import { sessionOptions, type AdminSession } from "./session";

export const ADMIN_ROUTE_MATCHERS = ["/admin/:path*", "/api/v1/admin/:path*"];

/**
 * Drop this into the project's `middleware.ts` (or compose it with other
 * matchers) to protect `/admin` and `/api/v1/admin`.
 */
export async function protectAdmin(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isLogin = pathname === "/admin/login";
  const isApi = pathname.startsWith("/api/v1/admin");

  const response = NextResponse.next();
  const session = await getIronSession<AdminSession>(
    request,
    response,
    sessionOptions(),
  );
  const signedIn = session.authenticated === true;

  if (!signedIn && !isLogin) {
    if (isApi) {
      return NextResponse.json({ detail: "Unauthorized" }, { status: 401 });
    }
    const login = request.nextUrl.clone();
    login.pathname = "/admin/login";
    login.search = "";
    if (pathname !== "/admin" && pathname !== "/admin/bookings") {
      login.searchParams.set("from", pathname);
    }
    return NextResponse.redirect(login);
  }

  if (signedIn && isLogin) {
    return NextResponse.redirect(new URL("/admin/bookings", request.url));
  }

  return response;
}
