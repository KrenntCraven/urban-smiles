import type { Metadata } from "next";
import { AppointmentForm } from "@/components/booking/appointment-form";
import {
  parseBookingPrefill,
  toAppointmentDefaults,
} from "@/lib/booking/schema";
import { getServiceBySlug, getServiceOptions } from "@/lib/services/catalog";
import { resolveDentistId } from "@/lib/team/roster";

export const metadata: Metadata = {
  title: "Book an Appointment — Urban Smiles",
  description:
    "Request a visit at any Urban Smiles branch. Confirmation by SMS within one business hour.",
};

export default async function BookPage(props: PageProps<"/book">) {
  const prefill = parseBookingPrefill(await props.searchParams);
  const dentist = resolveDentistId(prefill.dentist ?? prefill.id);
  const service = prefill.service
    ? getServiceBySlug(prefill.service)
    : dentist
      ? getServiceBySlug(dentist.defaultServiceSlug)
      : undefined;

  const defaults = toAppointmentDefaults({
    ...prefill,
    service: service?.slug,
    dentist: dentist?.slug,
    location: prefill.location ?? dentist?.branchId,
  });

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 sm:py-16 lg:py-20">
      <p className="flex items-center gap-3 text-xs font-semibold tracking-[0.28em] text-teal uppercase">
        <span aria-hidden="true" className="h-px w-8 bg-teal/40" />
        Book an Appointment
      </p>

      <h1 className="mt-5 font-display text-4xl leading-[1.05] font-semibold tracking-tight text-ink sm:text-5xl">
        {service ? `Book ${service.name.toLowerCase()}` : "Request a visit"}
      </h1>

      <p className="mt-5 max-w-xl text-lg leading-relaxed text-ink/80">
        Tell us when suits you. After you send ID or HMO details, the booking
        sits in pending verification until front desk approves it. Nothing is
        charged today.
      </p>

      <div className="mt-8 rounded-2xl bg-cream p-4 shadow-lg shadow-ink/5 ring-1 ring-ink/10 sm:mt-10 sm:p-8">
        <AppointmentForm services={getServiceOptions()} defaults={defaults} />
      </div>
    </div>
  );
}
