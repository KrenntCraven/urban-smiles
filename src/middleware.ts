/**
 * Next.js middleware entry. Matcher must stay a static array here — Turbopack
 * cannot follow an imported constant for `config.matcher`.
 */
import { protectAdmin } from "@/admin/protect";

export const middleware = protectAdmin;

export const config = {
  matcher: ["/admin/:path*", "/api/v1/admin/:path*"],
};
