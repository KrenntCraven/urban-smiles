/** App Router bookings dashboard. force-dynamic so the queue is never cached. */
export {
  AdminBookingsPage as default,
  adminBookingsMetadata as metadata,
} from "@/admin/screens/bookings-page";

export const dynamic = "force-dynamic";
