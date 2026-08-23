import type { AppointmentInput } from "@/lib/booking/schema";
import { clinicToday, formatPatientName } from "@/lib/booking/schema";
import type { BookingRecord } from "@/lib/booking/records";
import {
  listBookings,
  saveBooking,
  toStoredDocument,
} from "@/lib/booking/store";
import type { FileBlob } from "@/lib/booking/store";
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
  ];
}

let seeded = false;

export function ensureDemoBookings(): void {
  if (!demoSeedEnabled() || seeded) return;
  seeded = true;
  if (listBookings().length > 0) return;

  for (const sample of samples()) {
    const documents = sample.documents;
    const record: BookingRecord = {
      reference: sample.reference,
      status: "pending_verification",
      createdAt: hoursAgo(sample.submittedHoursAgo),
      appointment: sample.appointment,
      documents: Object.entries(documents).map(([kind, blob]) =>
        toStoredDocument(kind as keyof typeof documents, blob),
      ),
      staffInbox: `${formatPatientName(sample.appointment)} submitted ID/HMO documents for ${sample.appointment.preferredDate} ${sample.appointment.preferredTime}.`,
    };

    saveBooking(record, {
      hmoCardFront: documents.hmoCardFront,
      hmoCardBack: documents.hmoCardBack,
      governmentId: documents.governmentId,
    });
  }
}
