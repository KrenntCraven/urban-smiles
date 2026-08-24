import { redirect } from "next/navigation";

/** /admin → /admin/bookings */
export default function AdminIndexPage() {
  redirect("/admin/bookings");
}
