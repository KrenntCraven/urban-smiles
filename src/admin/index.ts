/**
 * Self-contained admin module. Copy `src/admin` into another Next.js app,
 * then wire the thin files under `src/app/admin`, `src/app/api/v1/admin`,
 * and `src/middleware.ts`.
 *
 * Reading order (auth → queue → public booking):
 * 1. session.ts / auth.ts / protect.ts — cookie login
 * 2. screens + components — dashboard, ID lightbox, reject reason
 * 3. service.ts — list/search/approve/reject
 * 4. Public side: schema.ts → actions.submitAppointment → store/persist
 * 5. Approve: booking/approve.ts → calendar/invite.ts → calendar/google.ts
 */
export { protectAdmin, ADMIN_ROUTE_MATCHERS } from "./protect";
export {
  sessionOptions,
  sessionPassword,
  ADMIN_COOKIE,
  type AdminSession,
} from "./session";
export {
  listAdminBookings,
  approveAdminBooking,
  rejectAdminBooking,
  readAdminDocument,
  parseAdminQuery,
  adminBranches,
  AdminServiceError,
} from "./service";
export type {
  AdminBooking,
  AdminBookingList,
  AdminBookingQuery,
  AdminBookingStatus,
  AdminBookingSummary,
  AdminBranchSummary,
  AdminDecisionPeriod,
  AdminPeriodSummary,
  AdminProof,
} from "./types";
export { jsonError } from "./http";
export {
  listBookings,
  approveBooking,
  rejectBooking,
  bookingFile,
} from "./api/bookings";
