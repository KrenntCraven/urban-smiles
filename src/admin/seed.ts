/**
 * Local demo patients for ADMIN_SEED_DEMO=1 when Supabase is off.
 * Skipped in production-shaped deploys that have a real database.
 */
import type { AppointmentInput } from "@/lib/booking/schema";
import { clinicToday, formatPatientName } from "@/lib/booking/schema";
import type { BookingRecord, BookingStatus } from "@/lib/booking/records";
import {
  listBookings,
  saveBooking,
  toStoredDocument,
} from "@/lib/booking/store";
import type { FileBlob } from "@/lib/booking/blobs";
import { supabaseConfigured } from "@/lib/supabase/admin";
import {
  governmentIdCard,
  hmoCardBack,
  hmoCardFront,
} from "./sample-documents";

/**
 * Opt-in demo data for the verification queue. Off unless ADMIN_SEED_DEMO=1, so
 * a real deployment can never grow fake patients on its own.
 */
export function demoSeedEnabled(): boolean {
  return process.env.ADMIN_SEED_DEMO === "1";
}

/** Clinic-local date `days` from today, so seeded visits never fall in the past. */
function dateIn(days: number): string {
  const [year, month, day] = clinicToday().split("-").map(Number);
  const shifted = new Date(Date.UTC(year, month - 1, day + days));
  return shifted.toISOString().slice(0, 10);
}

function hoursAgo(hours: number): string {
  return new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();
}

type Sample = {
  reference: string;
  submittedHoursAgo: number;
  status?: BookingStatus;
  reviewNote?: string;
  appointment: AppointmentInput;
  documents: Partial<
    Record<"governmentId" | "hmoCardFront" | "hmoCardBack", FileBlob>
  >;
};

function samples(): Sample[] {
  return [
    {
      reference: "US-4KD92M",
      submittedHoursAgo: 2,
      appointment: {
        serviceSlug: "routine-cleaning",
        firstName: "Marisol",
        middleName: "Reyes",
        noMiddleName: false,
        surname: "Dela Peña",
        email: "marisol.delapena@example.ph",
        phone: "+639171234567",
        locationId: "makati",
        preferredDate: dateIn(2),
        preferredTime: "10:00",
        coverageType: "hmo",
        hmoProvider: "Maxicare",
        hmoMemberId: "1042-8873-19",
        privacyConsent: true,
        isNewPatient: true,
        notes: "Gums bleed when brushing. Prefers a morning slot.",
        channel: "website",
      },
      documents: {
        hmoCardFront: hmoCardFront({
          provider: "Maxicare",
          memberName: "MARISOL R. DELA PEÑA",
          memberId: "1042-8873-19",
          plan: "Platinum PPO",
          validUntil: "12/2027",
        }),
        hmoCardBack: hmoCardBack({
          provider: "Maxicare",
          memberName: "MARISOL R. DELA PEÑA",
          memberId: "1042-8873-19",
          plan: "Platinum PPO",
          validUntil: "12/2027",
        }),
      },
    },
    {
      reference: "US-7PQ13X",
      submittedHoursAgo: 6,
      appointment: {
        serviceSlug: "teeth-whitening",
        firstName: "Andres",
        noMiddleName: true,
        surname: "Bonifacio",
        suffix: "Jr.",
        email: "andres.bonifacio@example.ph",
        phone: "09981112222",
        locationId: "bgc",
        preferredDate: dateIn(4),
        preferredTime: "15:00",
        coverageType: "self-pay",
        privacyConsent: true,
        isNewPatient: false,
        channel: "website",
      },
      documents: {
        governmentId: governmentIdCard({
          surname: "BONIFACIO",
          givenNames: "ANDRES",
          middleName: "—",
          birthDate: "1990-11-30",
          sex: "M",
          address: "18 Rizal St., Taguig City",
          idNumber: "7712 4408 9931",
        }),
      },
    },
    {
      reference: "US-2NB56T",
      submittedHoursAgo: 20,
      appointment: {
        serviceSlug: "dental-implants",
        firstName: "Corazon",
        middleName: "Aquino",
        noMiddleName: false,
        surname: "Villanueva",
        phone: "+639064445566",
        locationId: "ortigas",
        preferredDate: dateIn(1),
        preferredTime: "13:00",
        coverageType: "hmo",
        hmoProvider: "Intellicare",
        hmoMemberId: "INT-556201",
        privacyConsent: true,
        isNewPatient: false,
        notes:
          "Referred by Dr. Santos. Lower left molar extracted in March; asking whether the site has healed enough for an implant.",
        channel: "messenger",
      },
      documents: {
        hmoCardFront: hmoCardFront({
          provider: "Intellicare",
          memberName: "CORAZON A. VILLANUEVA",
          memberId: "INT-556201",
          plan: "Gold Standard",
          validUntil: "06/2027",
        }),
      },
    },
    {
      reference: "US-9WR30F",
      submittedHoursAgo: 31,
      appointment: {
        serviceSlug: "invisalign-clear-aligners",
        firstName: "Joshua",
        middleName: "Lim",
        noMiddleName: false,
        surname: "Tan",
        email: "joshua.tan@example.ph",
        phone: "09175558899",
        locationId: "qc",
        preferredDate: dateIn(7),
        preferredTime: "17:00",
        coverageType: "self-pay",
        privacyConsent: true,
        isNewPatient: true,
        channel: "website",
      },
      documents: {
        governmentId: governmentIdCard({
          surname: "TAN",
          givenNames: "JOSHUA",
          middleName: "LIM",
          birthDate: "2001-04-12",
          sex: "M",
          address: "9 Katipunan Ave., Quezon City",
          idNumber: "3390 1187 2245",
        }),
      },
    },
    {
      reference: "US-5LM88C",
      submittedHoursAgo: 6,
      status: "approved",
      appointment: {
        serviceSlug: "routine-cleaning",
        firstName: "Paolo",
        middleName: "Cruz",
        noMiddleName: false,
        surname: "Mendoza",
        email: "paolo.mendoza@example.ph",
        phone: "09178880011",
        locationId: "bgc",
        preferredDate: dateIn(3),
        preferredTime: "09:00",
        coverageType: "self-pay",
        privacyConsent: true,
        isNewPatient: false,
        channel: "website",
      },
      documents: {
        governmentId: governmentIdCard({
          surname: "MENDOZA",
          givenNames: "PAOLO",
          middleName: "CRUZ",
          birthDate: "1988-02-19",
          sex: "M",
          address: "22 McKinley Pkwy, Taguig City",
          idNumber: "5510 2291 7740",
        }),
      },
    },
    {
      reference: "US-8HT21K",
      submittedHoursAgo: 10,
      appointment: {
        serviceSlug: "teeth-whitening",
        firstName: "Isabelle",
        middleName: "Santos",
        noMiddleName: false,
        surname: "Garcia",
        email: "isabelle.garcia@example.ph",
        phone: "09271230044",
        locationId: "bgc",
        preferredDate: dateIn(5),
        preferredTime: "14:00",
        coverageType: "self-pay",
        privacyConsent: true,
        isNewPatient: true,
        channel: "website",
      },
      documents: {
        governmentId: governmentIdCard({
          surname: "GARCIA",
          givenNames: "ISABELLE",
          middleName: "SANTOS",
          birthDate: "1996-07-08",
          sex: "F",
          address: "5 26th Street, Taguig City",
          idNumber: "8821 0046 1193",
        }),
      },
    },
    {
      reference: "US-3VR09P",
      submittedHoursAgo: 10,
      status: "rejected",
      reviewNote: "HMO card photo is unreadable. Ask the patient to resubmit.",
      appointment: {
        serviceSlug: "routine-cleaning",
        firstName: "Miguel",
        middleName: "Ramos",
        noMiddleName: false,
        surname: "Santos",
        email: "miguel.santos@example.ph",
        phone: "09190007721",
        locationId: "makati",
        preferredDate: dateIn(2),
        preferredTime: "11:00",
        coverageType: "hmo",
        hmoProvider: "Medicard",
        hmoMemberId: "MC-440192",
        privacyConsent: true,
        isNewPatient: false,
        channel: "website",
      },
      documents: {
        hmoCardFront: hmoCardFront({
          provider: "Medicard",
          memberName: "MIGUEL R. SANTOS",
          memberId: "MC-440192",
          plan: "Prime",
          validUntil: "03/2027",
        }),
      },
    },
    {
      reference: "US-6JY44W",
      submittedHoursAgo: 45 * 24,
      status: "approved",
      appointment: {
        serviceSlug: "routine-cleaning",
        firstName: "Helena",
        noMiddleName: true,
        surname: "Reyes",
        email: "helena.reyes@example.ph",
        phone: "09173334455",
        locationId: "ortigas",
        preferredDate: dateIn(12),
        preferredTime: "10:00",
        coverageType: "self-pay",
        privacyConsent: true,
        isNewPatient: false,
        channel: "website",
      },
      documents: {
        governmentId: governmentIdCard({
          surname: "REYES",
          givenNames: "HELENA",
          middleName: "—",
          birthDate: "1984-09-21",
          sex: "F",
          address: "14 Emerald Ave., Pasig City",
          idNumber: "2201 8834 5560",
        }),
      },
    },
    {
      reference: "US-1QP70D",
      submittedHoursAgo: 400 * 24,
      status: "rejected",
      reviewNote: "Name on the ID does not match the booking.",
      appointment: {
        serviceSlug: "teeth-whitening",
        firstName: "Ramon",
        middleName: "Dela",
        noMiddleName: false,
        surname: "Cruz",
        email: "ramon.cruz@example.ph",
        phone: "09280001122",
        locationId: "qc",
        preferredDate: dateIn(20),
        preferredTime: "16:00",
        coverageType: "self-pay",
        privacyConsent: true,
        isNewPatient: true,
        channel: "website",
      },
      documents: {
        governmentId: governmentIdCard({
          surname: "CRUZ",
          givenNames: "RAMON",
          middleName: "DELA",
          birthDate: "1979-01-03",
          sex: "M",
          address: "41 Maginhawa St., Quezon City",
          idNumber: "1188 4402 7731",
        }),
      },
    },
  ];
}

let seeded = false;

export async function ensureDemoBookings(): Promise<void> {
  if (supabaseConfigured()) return;
  if (!demoSeedEnabled() || seeded) return;
  seeded = true;
  if ((await listBookings()).length > 0) return;

  for (const sample of samples()) {
    const documents = sample.documents;
    const status = sample.status ?? "pending_verification";
    const record: BookingRecord = {
      reference: sample.reference,
      status,
      createdAt: hoursAgo(sample.submittedHoursAgo),
      appointment: sample.appointment,
      documents: Object.entries(documents).map(([kind, blob]) =>
        toStoredDocument(kind as keyof typeof documents, blob),
      ),
      staffInbox: `${formatPatientName(sample.appointment)} submitted ID/HMO documents for ${sample.appointment.preferredDate} ${sample.appointment.preferredTime}.`,
      review:
        status === "pending_verification"
          ? undefined
          : {
              decidedAt: hoursAgo(Math.max(1, sample.submittedHoursAgo - 4)),
              decision: status,
              note: sample.reviewNote,
            },
    };

    await saveBooking(record, {
      hmoCardFront: documents.hmoCardFront,
      hmoCardBack: documents.hmoCardBack,
      governmentId: documents.governmentId,
    });
  }
}
