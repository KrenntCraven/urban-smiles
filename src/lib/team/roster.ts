import {
  dentistSpecialtyOrder,
  type Dentist,
  type DentistSpecialty,
} from "./types";

export const dentists: readonly Dentist[] = [
  {
    slug: "amelia-santos",
    name: "Dr. Amelia Santos",
    credential: "DMD",
    role: "Lead Dentist & Cosmetic Director",
    specialties: ["cosmetic"],
    focusAreas: ["Porcelain veneers", "Same-day crowns", "Smile design"],
    philosophy:
      "A confident smile should still look like yours, so I plan every cosmetic case around your own proportions rather than a template. You will see the design and approve it before I touch a single tooth.",
    photo: "/team/dr-amelia-santos.png",
    photoAlt:
      "Dr. Amelia Santos in teal scrubs, standing in a sunlit Urban Smiles treatment room.",
    practicingSince: 2009,
    education: [
      {
        qualification: "Doctor of Dental Medicine",
        institution: "University of the Philippines Manila",
        year: 2009,
      },
      {
        qualification: "Residency in Advanced Aesthetic Dentistry",
        institution: "New York University College of Dentistry",
        year: 2013,
      },
    ],
    certifications: [
      "Fellow, Philippine Dental Association",
      "Certified Digital Smile Design provider",
      "Advanced Cardiac Life Support (ACLS)",
    ],
    officeHours: [
      { days: "Monday – Thursday", hours: "9:00 AM – 5:00 PM" },
      { days: "Saturday", hours: "9:00 AM – 1:00 PM" },
    ],
    branchId: "bgc",
    defaultServiceSlug: "teeth-whitening",
  },
  {
    slug: "benjamin-cruz",
    name: "Dr. Benjamin Cruz",
    credential: "DDS",
    role: "Orthodontist",
    specialties: ["orthodontics", "cosmetic"],
    focusAreas: ["Clear aligners", "Adult orthodontics", "Bite correction"],
    philosophy:
      "Straightening teeth is a two-year conversation, not a single procedure, so I explain every adjustment and what it buys you. Patients who understand the plan are the ones who finish it.",
    photo: "/team/dr-benjamin-cruz.jpg",
    photoAlt:
      "Dr. Benjamin Cruz in teal scrubs, standing in a sunlit Urban Smiles treatment room.",
    practicingSince: 2011,
    education: [
      {
        qualification: "Doctor of Dental Surgery",
        institution: "University of Santo Tomas",
        year: 2011,
      },
      {
        qualification: "Master of Science in Orthodontics",
        institution: "University of Melbourne",
        year: 2015,
      },
    ],
    certifications: [
      "Diplomate, Philippine Association of Orthodontists",
      "Invisalign Platinum Provider",
      "Certified in temporary anchorage devices",
    ],
    officeHours: [
      { days: "Tuesday – Friday", hours: "10:00 AM – 6:00 PM" },
      { days: "Saturday", hours: "9:00 AM – 3:00 PM" },
    ],
    branchId: "makati",
    defaultServiceSlug: "invisalign-clear-aligners",
  },
  {
    slug: "celine-reyes",
    name: "Dr. Celine Reyes",
    credential: "DMD",
    role: "Pediatric Dentist",
    specialties: ["pediatric"],
    focusAreas: ["First dental visits", "Sealants & fluoride", "Anxious children"],
    philosophy:
      "A child's first few visits decide whether they keep coming back as an adult, so we move at their pace and never spring surprises. Nothing happens in my chair that a child has not already seen and held.",
    photo: "/team/dr-celine-reyes.jpg",
    photoAlt:
      "Dr. Celine Reyes in teal scrubs, standing in a sunlit Urban Smiles treatment room.",
    practicingSince: 2013,
    education: [
      {
        qualification: "Doctor of Dental Medicine",
        institution: "Centro Escolar University",
        year: 2013,
      },
      {
        qualification: "Residency in Pediatric Dentistry",
        institution: "Philippine Children's Medical Center",
        year: 2017,
      },
    ],
    certifications: [
      "Member, Philippine Pediatric Dental Society",
      "Certified in nitrous oxide sedation",
      "Pediatric Advanced Life Support (PALS)",
    ],
    officeHours: [
      { days: "Monday – Wednesday", hours: "9:00 AM – 5:00 PM" },
      { days: "Friday", hours: "9:00 AM – 5:00 PM" },
      { days: "Saturday", hours: "8:00 AM – 12:00 NN" },
    ],
    branchId: "qc",
    defaultServiceSlug: "routine-cleaning",
  },
];

/**
 * Derived rather than hand-listed so a specialty can never appear in the filter
 * bar with nothing behind it, and no dentist can become unreachable.
 */
export function getDentistSpecialties(): DentistSpecialty[] {
  const present = new Set(dentists.flatMap((dentist) => dentist.specialties));
  return dentistSpecialtyOrder.filter((specialty) => present.has(specialty));
}

export function getDentistBySlug(slug: string): Dentist | undefined {
  return dentists.find((dentist) => dentist.slug === slug);
}

/**
 * Accepts the canonical slug and the short first-name IDs used by campaign
 * links such as `/dentists?id=amelia`.
 */
export function resolveDentistId(id: string | undefined): Dentist | undefined {
  if (!id) return undefined;
  const normalized = id.trim().toLowerCase();
  return dentists.find(
    (dentist) =>
      dentist.slug === normalized ||
      dentist.slug.split("-")[0] === normalized,
  );
}
