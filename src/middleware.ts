import { protectAdmin } from "@/admin/protect";

export const middleware = protectAdmin;

export const config = {
  matcher: ["/admin/:path*", "/api/v1/admin/:path*"],
};
